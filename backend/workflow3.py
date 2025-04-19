import os
import logging
from dotenv import load_dotenv
from langchain_cohere import CohereEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_pinecone import PineconeVectorStore
from langgraph.graph import StateGraph, END
from langchain_core.documents import Document
from typing import TypedDict, Optional, Dict, Any, List
from langchain import hub
from langchain.agents import create_react_agent, AgentExecutor
from langchain.tools import tool

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
pinecone_environment = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")

embeddings = CohereEmbeddings(cohere_api_key=cohere_api_key, model="embed-english-v3.0")
pc = PineconeVectorStore.from_existing_index(
    index_name="farmwise-ai",
    embedding=embeddings
)

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", api_key=google_api_key)

class FarmerState(TypedDict):
    profile: Dict[str, str]
    schemes: List[Document]
    recommendations: Optional[str]
    visuals: Optional[List[str]]

# Define tool for the ReAct agent
@tool
def pinecone_search(query: str) -> List[Document]:
    """Search for agricultural schemes in the Pinecone index based on a query."""
    logger.info("[Pinecone Search Tool] Searching with query: %s", query)
    try:
        results = pc.similarity_search_with_score(query=query, k=5)
        return [
            Document(
                page_content=result[0].page_content,
                metadata={
                    "url": result[0].metadata.get("url", "unknown"),
                    "source": "pinecone",
                    "title": result[0].metadata.get("title", "Untitled")
                }
            )
            for result in results if result[1] > 0.2
        ]
    except Exception as e:
        logger.error("[Pinecone Search Tool] Search failed: %s", str(e))
        return []

tools = [pinecone_search]

# Load ReAct prompt and create agent
prompt_template = hub.pull("hwchase17/react")
agent = create_react_agent(llm, tools, prompt_template)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

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
    return {"profile": profile, "schemes": [], "recommendations": None, "visuals": []}

def react_agent_node(state: FarmerState) -> Dict[str, Any]:
    logger.info("[ReAct Agent] Starting agent to suggest schemes from Pinecone.")
    profile = state["profile"]
    combined_input = f"""
    Given the farmer profile: {profile}, suggest 4-6 agricultural schemes from the Pinecone database. Use the pinecone_search tool to retrieve relevant schemes. Reason step-by-step to:
    1. Search for schemes matching the profile (e.g., land size, crop type, irrigation).
    2. Verify eligibility based on profile details.
    3. Provide recommendations with quantified benefits (e.g., subsidy amounts) and steps.
    Use markdown with headers (## Scheme Name).
    """

    try:
        response = agent_executor.invoke({"input": combined_input})
        logger.info("[ReAct Agent] Agent response: %s", response["output"][:100] if "output" in response else "No output")

        # Parse agent response to extract schemes and recommendations
        schemes = []
        recommendations = response.get("output", "No recommendations generated due to insufficient Pinecone data.")

        # Extract schemes from tool outputs
        tool_outputs = response.get("intermediate_steps", [])
        for step in tool_outputs:
            if isinstance(step[1], list) and all(isinstance(doc, Document) for doc in step[1]):
                schemes.extend(step[1])

        if not schemes:
            schemes.append(Document(
                page_content="No schemes found in Pinecone. Ensure the database contains relevant data.",
                metadata={"source": "placeholder"}
            ))

        return {
            "schemes": schemes,
            "recommendations": recommendations,
            "visuals": []
        }
    except Exception as e:
        logger.error("[ReAct Agent] Execution failed: %s", str(e))
        return {"schemes": [], "recommendations": "Error generating recommendations.", "visuals": []}

workflow = StateGraph(FarmerState)

workflow.add_node("profile_analysis", profile_analysis_node)
workflow.add_node("react_agent", react_agent_node)

workflow.set_entry_point("profile_analysis")
workflow.add_edge("profile_analysis", "react_agent")
workflow.add_edge("react_agent", END)

app = workflow.compile()

def run_workflow(initial_state: Optional[FarmerState] = None) -> FarmerState:
    logger.info("[Workflow] Starting execution.")
    default_state: FarmerState = {
        "profile": {"village": "hasdar", "district": "Pune", "state": "Maharashtra", "land_size": "2 hectares", "land_ownership": "owned", "crop_type": "wheat", "irrigation": "rain-fed", "income": "150000", "caste_category": "general", "bank_account": "yes", "existing_schemes": "none"},
        "schemes": [],
        "recommendations": None,
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

if __name__ == "__main__":
    result = run_workflow()
    print("Final Schemes:", result["schemes"])
    print("Recommendations:", result["recommendations"])