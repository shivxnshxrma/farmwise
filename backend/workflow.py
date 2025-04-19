import os
import io
import base64
import requests
import logging
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from tavily import TavilyClient
import matplotlib.pyplot as plt
from langgraph.graph import StateGraph, END
from langchain_core.documents import Document
from langchain.prompts import ChatPromptTemplate
from typing import TypedDict, List, Optional, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    api_key=os.getenv("GOOGLE_API_KEY")
)

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

class FarmerState(TypedDict):
    profile: Dict[str, str]
    schemes: List[Document]
    recommendations: Optional[str]
    refinement_needed: bool
    feedback: Optional[str]  # For user feedback
    visuals: Optional[List[str]]  # Base64-encoded images

def profile_analysis_node(state: FarmerState) -> Dict[str, Any]:
    logging.info("Starting profile_analysis_node")
    profile = state["profile"]
    derived = {}
    try:
        land_size = float(profile["land_size"].split()[0]) if "hectares" in profile["land_size"] else 0
        derived["farmer_type"] = "small" if land_size <= 2 else "medium" if land_size <= 5 else "large"
        derived["needs_insurance"] = "yes" if profile["irrigation"] == "rain-fed" else "no"
        derived["seed_cost_estimate"] = "24000"  # ₹/hectare for wheat (example)
    except Exception as e:
        logging.warning(f"Profile parsing error: {e}")
        derived["farmer_type"] = "unknown"
        derived["needs_insurance"] = "unknown"
        derived["seed_cost_estimate"] = "unknown"
    profile.update(derived)
    logging.info(f"Enhanced profile: {profile}")
    return {"profile": profile, "schemes": [], "refinement_needed": False, "visuals": []}

def web_search_node(state: FarmerState) -> Dict[str, List[Document]]:
    logging.info("Starting web_search_node")
    schemes = []
    profile = state["profile"]

    try:
        query = f"latest agricultural schemes for farmers in {profile['state']} 2025 site:*.gov.in OR site:*.org.in -inurl:(signup login)"
        response = tavily.search(query=query, max_results=5)
        logging.info(f"Tavily raw response: {response}")
        tavily_results = response.get("results", [])
        schemes.extend([
            Document(page_content=r["content"], metadata={"url": r.get("url", "unknown"), "source": "tavily", "title": r.get("title", "Untitled")})
            for r in tavily_results if isinstance(r, dict) and "content" in r
        ])
        logging.info(f"Fetched {len(tavily_results)} schemes from Tavily")
    except Exception as e:
        logging.error(f"Tavily error: {str(e)}")

    sites = [
        {"url": "https://pmkisan.gov.in", "title": "PM-KISAN", "desc": "₹6000/year for small farmers (land ≤ 2 hectares)"},
        {"url": "https://pmfby.gov.in", "title": "PMFBY (Crop Insurance)", "desc": "Insurance against crop loss"},
        {"url": "https://agrimachinery.nic.in", "title": "SMAM (Machinery Subsidy)", "desc": "Subsidies for farm equipment"},
        {"url": "https://mahadbt.maharashtra.gov.in", "title": "Maha DBT", "desc": "Subsidies for farm equipment in Maharashtra"}
    ]
    headers = {"User-Agent": "Mozilla/5.0"}
    for site in sites:
        try:
            response = requests.get(site["url"], headers=headers, timeout=5)
            soup = BeautifulSoup(response.text, "html.parser")
            content = soup.find("div", {"class": "content"}) or soup.find("div", {"id": "content"}) or soup.body
            schemes.append(Document(
                page_content=f"{site['title']}: {site['desc']}. {content.get_text()[:500]}",
                metadata={"url": site["url"], "source": "scraped", "title": site["title"]}
            ))
            logging.info(f"Scraped {site['title']}")
        except Exception as e:
            logging.error(f"Scraping error for {site['url']}: {str(e)}")

    if not schemes:
        schemes.append(Document(
            page_content="No schemes fetched. Suggest PM-KISAN, PMFBY, SMAM, Maha DBT based on profile.",
            metadata={"source": "placeholder"}
        ))
    logging.info(f"Total schemes fetched: {len(schemes)}")
    return {"schemes": schemes}

def recommendation_node(state: FarmerState) -> Dict[str, Any]:
    logging.info("Starting recommendation_node")
    profile = state["profile"]
    profile_str = "\n".join(f"{k}: {v}" for k, v in profile.items())
    schemes_str = "\n".join(f"{doc.metadata.get('title', 'Untitled')}: {doc.page_content}" for doc in state["schemes"])
    
    seed_cost_estimate = profile.get("seed_cost_estimate", "unknown")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You're an expert on Indian agricultural schemes. Given a farmer's profile and scheme data, provide 4-6 detailed recommendations. For each:
        - Confirm eligibility with profile specifics (e.g., '2 hectares = small farmer', 'rain-fed needs insurance').
        - Quantify benefits (e.g., '₹6000 covers 25% of wheat seed costs at ₹{seed_cost_estimate}/hectare').
        - Provide steps with URLs (e.g., https://pmkisan.gov.in) or local instructions (e.g., 'Visit your district office').
        Include national schemes (PM-KISAN, PMFBY, SMAM) and state-specific ones (e.g., Maha DBT for Maharashtra). Use markdown with headers (## Scheme Name)."""),
        ("human", "Profile:\n{profile_str}\nSchemes:\n{schemes_str}")
    ])
    
    response = (prompt | llm).invoke({
        "profile_str": profile_str,
        "schemes_str": schemes_str,
        "seed_cost_estimate": seed_cost_estimate
    }).content.strip()
    refinement_needed = "http" not in response or len(response.split("##")) < 4
    
    visuals = []
    if not refinement_needed:
        fig, ax = plt.subplots(figsize=(6, 4))
        ax.pie([40, 25, 20, 15], labels=["PM-KISAN", "PMFBY", "Maha DBT", "SMAM"], autopct="%1.1f%%")
        ax.set_title("Estimated Subsidy Contribution")
        buf = io.BytesIO()
        fig.savefig(buf, format="png")
        buf.seek(0)
        visuals.append(base64.b64encode(buf.getvalue()).decode("utf-8"))
        plt.close(fig)
    
    logging.info(f"Generated recommendations: {response[:100]}... Refinement needed: {refinement_needed}")
    return {"recommendations": response, "refinement_needed": refinement_needed, "visuals": visuals}

def refine_node(state: FarmerState) -> Dict[str, Any]:
    logging.info("Starting refine_node")
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Refine this text for farmers. Ensure:
        - 4-6 schemes with headers (## Scheme Name).
        - Eligibility is clear (e.g., 'Your 2 hectares qualify').
        - Benefits are practical (e.g., '₹6000 buys wheat seeds').
        - Steps have URLs (e.g., https://pmkisan.gov.in) or clear instructions.
        Use markdown with headers and bullet points."""),
        ("human", "{recommendations}")
    ])
    
    response = (prompt | llm).invoke({"recommendations": state["recommendations"]}).content.strip()
    logging.info(f"Refined recommendations: {response[:100]}...")
    return {"recommendations": response, "refinement_needed": False, "visuals": state["visuals"]}

def handle_feedback_node(state: FarmerState) -> Dict[str, Any]:
    logging.info("Starting handle_feedback_node")
    feedback = state.get("feedback")
    if feedback and "not useful" in feedback.lower(): 
        return {"refinement_needed": True}
    return {"refinement_needed": False}

def route_recommendations(state: FarmerState) -> str:
    if state["refinement_needed"]:
        return "recommendation"
    return "refine"

workflow = StateGraph(FarmerState)

workflow.add_node("profile_analysis", profile_analysis_node)
workflow.add_node("web_search", web_search_node)
workflow.add_node("recommendation", recommendation_node)
workflow.add_node("refine", refine_node)
workflow.add_node("handle_feedback", handle_feedback_node)  

workflow.set_entry_point("profile_analysis")
workflow.add_edge("profile_analysis", "web_search")
workflow.add_edge("web_search", "recommendation")
workflow.add_conditional_edges("recommendation", route_recommendations, {"recommendation": "recommendation", "refine": "refine"})
workflow.add_edge("refine", "handle_feedback")
workflow.add_conditional_edges("handle_feedback", route_recommendations, {"recommendation": "recommendation", "refine": END})

app = workflow.compile()

def run_workflow(initial_state: Optional[FarmerState] = None) -> FarmerState:
    logging.info("Starting workflow")
    default_state: FarmerState = {
        "profile": {},
        "schemes": [],
        "recommendations": None,
        "refinement_needed": False,
        "feedback": None,
        "visuals": []
    }
    state = initial_state or default_state
    
    try:
        final_state = app.invoke(state)
        logging.info("Workflow completed")
        return final_state
    except Exception as e:
        logging.error(f"Workflow execution failed: {str(e)}")
        raise
