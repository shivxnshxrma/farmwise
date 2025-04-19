import os
import io
import base64
import requests
import logging
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_cohere import CohereEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_pinecone import PineconeVectorStore
import matplotlib.pyplot as plt
from langgraph.graph import StateGraph, END
from langchain_core.documents import Document
from langchain.prompts import ChatPromptTemplate
from typing import TypedDict, List, Optional, Dict, Any
from tavily import TavilyClient

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

pinecone_api_key = os.getenv("PINECONE_API_KEY")
cohere_api_key = os.getenv("COHERE_API_KEY")
google_api_key = os.getenv("GOOGLE_API_KEY")
tavily_api_key = os.getenv("TAVILY_API_KEY")
pinecone_environment = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")

embeddings = CohereEmbeddings(cohere_api_key=cohere_api_key, model="embed-english-v3.0")
pc = PineconeVectorStore.from_existing_index(
    index_name="farmwise-ai",
    embedding=embeddings
)

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", api_key=google_api_key)
tavily = TavilyClient(api_key=tavily_api_key)

class FarmerState(TypedDict):
    profile: Dict[str, str]
    schemes: List[Document]
    recommendations: Optional[str]
    refinement_needed: bool
    feedback: Optional[str]
    visuals: Optional[List[str]]

def profile_analysis_node(state: FarmerState) -> Dict[str, Any]:
    logger.info("[Profile Analysis] Starting analysis of farmer profile.")
    profile = state["profile"]
    derived = {}
    try:
        land_size = float(profile["land_size"].split()[0]) if "hectares" in profile["land_size"] else 0
        derived["farmer_type"] = "small" if land_size <= 2 else "medium" if land_size <= 5 else "large"
        derived["needs_insurance"] = "yes" if profile["irrigation"] == "rain-fed" else "no"
        derived["seed_cost_estimate"] = "24000"  # ₹/hectare for wheat
        logger.info("[Profile Analysis] Successfully derived profile attributes: %s", derived)
    except Exception as e:
        logger.warning("[Profile Analysis] Failed to parse profile: %s", str(e))
        derived["farmer_type"] = "unknown"
        derived["needs_insurance"] = "unknown"
        derived["seed_cost_estimate"] = "unknown"
    profile.update(derived)
    logger.info("[Profile Analysis] Enhanced profile: %s", profile)
    return {"profile": profile, "schemes": [], "refinement_needed": False, "visuals": []}

def web_search_node(state: FarmerState) -> Dict[str, List[Document]]:
    logger.info("[Web Search] Starting search for agricultural schemes.")
    schemes = []
    profile = state["profile"]

    try:
        query_text = f"Available agricultural schemes for farmer with profile: {profile}"
        logger.debug("[Web Search] Embedding query: %s", query_text)
        results = pc.similarity_search_with_score(query=query_text, k=5)
        logger.info(results);
        logger.info("[Web Search] Pinecone query returned %d matches", len(results))

        if len(results) == 0:
            logger.warning("[Web Search] No matches found in Pinecone. Check index data or query relevance. Consider adjusting query or verifying index content.")

        schemes.extend([
            Document(
                page_content=result[0].page_content,
                metadata={
                    "url": result[0].metadata.get("url", "unknown"),
                    "source": "pinecone",
                    "title": result[0].metadata.get("title", "Untitled")
                }
            )
            for result in results if result[1] > 0.2
        ])
        logger.info("[Web Search] Fetched %d schemes from Pinecone after filtering", len(schemes))

        tavily_query = f"agricultural schemes in India for a farmer with {profile['land_size']} land and {profile['irrigation']} irrigation"
        logger.debug("[Web Search] Tavily query: %s", tavily_query)
        tavily_response = tavily.get_search_context(query=tavily_query, max_results=3)
        logger.debug("[Web Search] Raw Tavily response: %s", tavily_response)

        if isinstance(tavily_response, str):
            logger.error("[Web Search] Tavily returned a string: %s", tavily_response)
            tavily_results = []
        elif isinstance(tavily_response, dict):
            tavily_results = tavily_response.get("results", [])
        else:
            logger.error("[Web Search] Unexpected Tavily response format: %s", type(tavily_response))
            tavily_results = []

        if tavily_results:
            schemes.extend([
                Document(
                    page_content=result.get("content", "No content available"),
                    metadata={
                        "url": result.get("url", "unknown"),
                        "source": "tavily",
                        "title": result.get("title", "Untitled")
                    }
                )
                for result in tavily_results
            ])
            logger.info("[Web Search] Fetched %d schemes from Tavily", len(tavily_results))
        else:
            logger.warning("[Web Search] No valid Tavily results retrieved, proceeding with other sources.")

    except Exception as e:
        logger.error("[Web Search] Search failed: %s", str(e))

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
            logger.info("[Web Search] Successfully scraped: %s", site["title"])
        except Exception as e:
            logger.error("[Web Search] Scraping error for %s: %s", site["url"], str(e))

    if not schemes:
        schemes.append(Document(
            page_content="No schemes fetched. Suggest PM-KISAN, PMFBY, SMAM, Maha DBT based on profile.",
            metadata={"source": "placeholder"}
        ))
    logger.info("[Web Search] Total schemes fetched: %d", len(schemes))
    return {"schemes": schemes}

def recommendation_node(state: FarmerState) -> Dict[str, Any]:
    logger.info("[Recommendation] Generating recommendations for farmer profile.")
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

    logger.info("[Recommendation] Generated recommendations (first 100 chars): %s... Refinement needed: %s", response[:100], refinement_needed)
    return {"recommendations": response, "refinement_needed": refinement_needed, "visuals": visuals}

def refine_node(state: FarmerState) -> Dict[str, Any]:
    logger.info("[Refine] Starting refinement of recommendations.")
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
    logger.info("[Refine] Refined recommendations (first 100 chars): %s...", response[:100])
    return {"recommendations": response, "refinement_needed": False, "visuals": state["visuals"]}

def handle_feedback_node(state: FarmerState) -> Dict[str, Any]:
    logger.info("[Feedback] Processing user feedback.")
    feedback = state.get("feedback")
    if feedback and "not useful" in feedback.lower():
        logger.info("[Feedback] Refinement triggered due to 'not useful' feedback.")
        return {"refinement_needed": True}
    logger.info("[Feedback] No refinement needed based on feedback.")
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
    logger.info("[Workflow] Starting execution.")
    default_state: FarmerState = {
        "profile": {"village": "hasdar", "district": "Pune", "state": "Maharashtra", "land_size": "2 hectares", "land_ownership": "owned", "crop_type": "wheat", "irrigation": "rain-fed", "income": "150000", "caste_category": "general", "bank_account": "yes", "existing_schemes": "none"},
        "schemes": [],
        "recommendations": None,
        "refinement_needed": False,
        "feedback": None,
        "visuals": []
    }
    state = initial_state or default_state

    try:
        final_state = app.invoke(state)
        logger.info("[Workflow] Execution completed successfully.")
        return final_state
    except Exception as e:
        logger.error("[Workflow] Execution failed: %s", str(e))
        raise