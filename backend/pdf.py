import streamlit as st
from PyPDF2 import PdfReader
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_cohere import CohereEmbeddings
import logging
import os
from dotenv import load_dotenv

# Load environment variables (optional, hardcoded for now)
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("pdf_processing.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Hardcode credentials (remove .env dependency for now)
PINECONE_API_KEY = "pcsk_4UTPKe_5mkXoweEw83pjDm5gebcCdjRA76kvzZ1fysbaNsnugm2ds7hyHJQ5YFtJ78oMk5"
PINECONE_HOST = "https://farmwise-ai-zuudimf.svc.aped-4627-b74a.pinecone.io"
PINECONE_ENVIRONMENT = "us-east-1"
COHERE_API_KEY = "fyYH6Yv6trfc81mWAtEjMqU8Uvnl5f77qIQjJT5g"

# Validate required credentials
if not all([PINECONE_API_KEY, PINECONE_HOST, PINECONE_ENVIRONMENT, COHERE_API_KEY]):
    logger.error("Missing required credentials. Please check hardcoded values.")
    st.error("Missing required credentials. Please check hardcoded values.")
    st.stop()

# Initialize Pinecone client
try:
    pc = Pinecone(api_key=PINECONE_API_KEY)
    logger.info("Successfully initialized Pinecone client.")
except Exception as e:
    logger.error(f"Failed to initialize Pinecone client: {e}")
    st.error(f"Failed to initialize Pinecone client: {e}")
    st.stop()

# Streamlit app configuration
st.set_page_config(page_title="PDF to Pinecone Storage", layout="wide")
st.title("📄 Upload PDF to Pinecone")
st.markdown("Upload a PDF, extract its text, and store embeddings in the 'farmwise-ai' Pinecone index using Cohere embeddings.")

# Sidebar for Pinecone index configuration
with st.sidebar:
    st.header("Pinecone Settings")
    index_name = "farmwise-ai"
    st.write(f"Using Pinecone index: {index_name}")
    st.write(f"Using host: {PINECONE_HOST}")
    create_index = st.checkbox("Recreate index if it doesn't exist", value=False, help="Only enable if you want to overwrite the existing index.")
    dimension = 1024  # Matches Cohere embed-english-v3.0

# Function to initialize or connect to Pinecone index
def init_pinecone_index(index_name, dimension):
    try:
        logger.debug(f"Checking existence of index: {index_name}")
        indexes = pc.list_indexes()
        logger.debug(f"Available indexes: {[idx['name'] for idx in indexes]}")
        if index_name not in [idx["name"] for idx in indexes]:
            if create_index:
                logger.info(f"Creating Pinecone index '{index_name}' with dimension {dimension}...")
                pc.create_index(
                    name=index_name,
                    dimension=dimension,
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region=PINECONE_ENVIRONMENT)
                )
                logger.info(f"Index '{index_name}' created.")
                st.success(f"Index '{index_name}' created.")
            else:
                logger.error(f"Index '{index_name}' does not exist. Enable 'Recreate index' or create it manually.")
                st.error(f"Index '{index_name}' does not exist. Enable 'Recreate index' or create it manually.")
                return None
        else:
            # Verify index configuration using available metadata
            index_info = next((idx for idx in pc.list_indexes() if idx["name"] == index_name), None)
            if index_info and (index_info.get("dimension", 0) != dimension or index_info.get("metric", "") != "cosine"):
                logger.error(f"Index '{index_name}' configuration mismatch. Expected: dimension={dimension}, metric=cosine. Got: dimension={index_info.get('dimension', 0)}, metric={index_info.get('metric', '')}")
                st.error(f"Index '{index_name}' configuration mismatch. Recreate the index with correct settings.")
                return None
            logger.info(f"Connected to existing index '{index_name}' with matching configuration.")
            st.info(f"Connected to existing index '{index_name}'.")

        # Initialize vector store (embedding will be set during storage)
        vector_store = PineconeVectorStore.from_existing_index(index_name=index_name, embedding=None)
        if not vector_store:
            logger.warning("Vector store initialization failed. Index may be unhealthy.")
            st.warning("Vector store initialization failed. Consider recreating the index.")
            return None
        return vector_store
    except Exception as e:
        logger.error(f"Error initializing Pinecone index: {e}")
        st.error(f"Error initializing Pinecone index: {e}")
        return None

# Function to extract text from PDF
def extract_pdf_text(pdf_file):
    try:
        logger.debug(f"Extracting text from PDF: {pdf_file.name}")
        pdf_reader = PdfReader(pdf_file)
        text = ""
        for page_num, page in enumerate(pdf_reader.pages, 1):
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
                logger.debug(f"Extracted text from page {page_num}")
        if not text.strip():
            logger.warning("No extractable text found in the PDF.")
            st.warning("No extractable text found in the PDF.")
            return None
        logger.info(f"Successfully extracted text from PDF: {len(text)} characters")
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        st.error(f"Error extracting text from PDF: {e}")
        return None

# Function to load and split documents
def load_and_split_documents(pdf_file):
    text = extract_pdf_text(pdf_file)
    if not text:
        return None
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=8000,
        chunk_overlap=200
    )
    documents = text_splitter.create_documents([text])
    logger.info(f"Split document into {len(documents)} chunks.")
    return documents

# Function to process PDF and store embeddings
def process_and_store_pdf(pdf_file, index_name):
    with st.spinner("Processing PDF and storing embeddings..."):
        logger.info(f"Starting processing for PDF: {pdf_file.name}")
        
        documents = load_and_split_documents(pdf_file)
        if not documents:
            logger.error("PDF processing aborted due to document loading failure.")
            return False

        logger.debug("Initializing Pinecone vector store...")
        vector_store = init_pinecone_index(index_name, dimension)
        if not vector_store:
            logger.error("Failed to initialize Pinecone vector store.")
            return False
        logger.info("Pinecone vector store initialized successfully.")

        logger.debug("Initializing Cohere embeddings...")
        try:
            embeddings = CohereEmbeddings(cohere_api_key=COHERE_API_KEY, model="embed-english-v3.0")
            logger.info("Cohere embeddings initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing Cohere embeddings: {e}")
            st.error(f"Error initializing Cohere embeddings: {e}")
            return False

        logger.debug("Storing embeddings in Pinecone...")
        try:
            # Update the vector store with embeddings
            vector_store = PineconeVectorStore.from_documents(
                documents=documents,
                index_name=index_name,
                embedding=embeddings
            )
            logger.info(f"Successfully stored {len(documents)} chunks in Pinecone index '{index_name}'.")
            st.success(f"Successfully stored {len(documents)} chunks in Pinecone index '{index_name}'.")
            return True
        except Exception as e:
            logger.error(f"Error storing embeddings in Pinecone: {e}")
            st.error(f"Error storing embeddings in Pinecone: {e}")
            return False

# Main app logic
def main():
    uploaded_file = st.file_uploader("Choose a PDF file", type=["pdf"])
    
    if uploaded_file:
        st.write(f"Selected file: {uploaded_file.name}")
        if st.button("Process PDF"):
            logger.info(f"Processing PDF button clicked for: {uploaded_file.name}")
            success = process_and_store_pdf(uploaded_file, "farmwise-ai")
            if success:
                st.success("PDF processed and embeddings stored successfully!")
                indexes = pc.list_indexes()
                for idx in indexes:
                    if idx["name"] == "farmwise-ai":
                        # Note: Direct record count is not available via list_indexes; approximate with vector store if needed
                        logger.info(f"Index '{idx['name']}' updated. (Record count not directly available via list_indexes)")
                        st.write(f"Index '{idx['name']}' updated. (Record count not directly available via list_indexes)")
            else:
                st.error("Failed to process PDF. Check the logs for details.")

    try:
        logger.debug("Fetching list of Pinecone indexes...")
        indexes = pc.list_indexes()
        if indexes:
            st.markdown("### Current Pinecone Indexes")
            for idx in indexes:
                logger.debug(f"Index: {idx['name']}, Dimension: {idx['dimension']}, Metric: {idx['metric']}")
                st.write(f"- {idx['name']} (Dimension: {idx['dimension']}, Metric: {idx['metric']})")
    except Exception as e:
        logger.warning(f"Could not fetch Pinecone indexes: {e}")
        st.warning(f"Could not fetch Pinecone indexes: {e}")

if __name__ == "__main__":
    logger.info("Starting Streamlit application.")
    main()