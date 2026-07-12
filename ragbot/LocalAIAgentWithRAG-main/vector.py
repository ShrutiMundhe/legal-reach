"""
Vector Store for Legal Reach RAG
Simple in-memory vector store using cosine similarity 
"""

import os
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict

# LangChain imports
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document

# Local imports
from config import DEFAULT_CONFIG, VECTORSTORE_DIR
from document_processor import process_legal_documents

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SimpleVectorStore:
    """Simple in-memory vector store using cosine similarity"""
    
    def __init__(self, embedding_function, k: int = 4):
        """Initialize vector store"""
        self.embedding_function = embedding_function
        self.k = k
        self.documents = []
        self.embeddings = None
        self.vectors_path = os.path.join(str(VECTORSTORE_DIR), "vectors.npy")
        self.docs_path = os.path.join(str(VECTORSTORE_DIR), "documents.pkl")
        
        logger.info(f"SimpleVectorStore initialized (k={k})")
    
    def add_documents(self, documents: List[Document], ids: List[str] = None):
        """Add documents and compute embeddings"""
        logger.info(f"Computing embeddings for {len(documents)} documents...")
        
        # Extract texts
        texts = [doc.page_content for doc in documents]
        
        # Get embeddings from Ollama
        embeddings = self.embedding_function.embed_documents(texts)
        embeddings = np.array(embeddings)
        
        # Store
        self.documents = documents
        self.embeddings = embeddings
        
        logger.info(f"Successfully embedded {len(documents)} documents (shape: {embeddings.shape})")
        self._save()
    
    def _save(self):
        """Save embeddings and documents to disk"""
        os.makedirs(str(VECTORSTORE_DIR), exist_ok=True)
        
        # Save embeddings
        np.save(self.vectors_path, self.embeddings)
        
        # Save documents
        import pickle
        with open(self.docs_path, 'wb') as f:
            pickle.dump(self.documents, f)
        
        logger.info(f"Saved vectors and documents to {VECTORSTORE_DIR}")
    
    def _load(self):
        """Load embeddings and documents from disk"""
        if os.path.exists(self.vectors_path) and os.path.exists(self.docs_path):
            self.embeddings = np.load(self.vectors_path)
            
            import pickle
            with open(self.docs_path, 'rb') as f:
                self.documents = pickle.load(f)
            
            logger.info(f"Loaded {len(self.documents)} documents and embeddings")
            return True
        return False
    
    def similarity_search(self, query: str, k: int = None) -> List[Document]:
        """Search for similar documents"""
        if k is None:
            k = self.k
        
        # Get query embedding
        query_embedding = np.array(self.embedding_function.embed_query(query))
        
        # Compute cosine similarity
        if self.embeddings is not None and len(self.embeddings) > 0:
            embeddings_norm = self.embeddings / np.linalg.norm(self.embeddings, axis=1, keepdims=True)
            query_norm = query_embedding / np.linalg.norm(query_embedding)
            
            similarities = np.dot(embeddings_norm, query_norm)
            top_indices = np.argsort(similarities)[-k:][::-1]
            
            results = [self.documents[i] for i in top_indices if i < len(self.documents)]
            logger.info(f"Found {len(results)} similar documents for query")
            return results
        
        logger.warning("No documents in vector store")
        return []
    
    def as_retriever(self, search_kwargs: Dict = None):
        """Return a retriever interface"""
        if search_kwargs is None:
            search_kwargs = {"k": self.k}
        
        k = search_kwargs.get("k", self.k)
        
        class Retriever:
            def __init__(self, vectorstore, k):
                self.vectorstore = vectorstore
                self.k = k
            
            def invoke(self, query: str):
                return self.vectorstore.similarity_search(query, k=self.k)
        
        return Retriever(self, k)


def create_embeddings():
    """Create embeddings using Ollama"""
    try:
        embeddings = OllamaEmbeddings(
            model="mxbai-embed-large",
            base_url="http://localhost:11434"
        )
        logger.info("[OK] Embeddings initialized (mxbai-embed-large)")
        return embeddings
    except Exception as e:
        logger.error(f"[ERROR] Failed to initialize embeddings: {e}")
        raise


def build_vectorstore():
    """Build or load vector store from legal documents"""
    
    db_location = str(VECTORSTORE_DIR)
    os.makedirs(db_location, exist_ok=True)
    
    logger.info(f"[VECTORSTORE] Location: {db_location}")
    
    # Create embeddings
    embeddings = create_embeddings()
    
    # Create vector store
    vector_store = SimpleVectorStore(embeddings, k=DEFAULT_CONFIG.vectorstore.retrieval_k)
    
    # Check if we need to load or create
    vectors_exist = os.path.exists(vector_store.vectors_path)
    
    if vectors_exist:
        logger.info("[OK] Loading existing vector store...")
        vector_store._load()
    else:
        logger.info("[INIT] Creating new vector store from legal documents...")
        logger.info("[PROCESSING] Documents...")
        
        documents = process_legal_documents()
        
        if not documents:
            logger.warning("[WARNING] No documents found! Vector store will be empty.")
            documents = []
        else:
            logger.info(f"[OK] Loaded {len(documents)} document chunks")
            
            # Add documents
            ids = [f"doc_{i}" for i in range(len(documents))]
            vector_store.add_documents(documents=documents, ids=ids)
            logger.info(f"[OK] Successfully added {len(documents)} chunks to vector store")
    
    # Create retriever
    logger.info(f"[SEARCH] Creating retriever (top-k={DEFAULT_CONFIG.vectorstore.retrieval_k})...")
    retriever = vector_store.as_retriever(
        search_kwargs={"k": DEFAULT_CONFIG.vectorstore.retrieval_k}
    )
    
    logger.info("[OK] Vector store ready for queries")
    
    return vector_store, retriever


#------------------- INITIALIZATION --------------------

# Create vector store and retriever when module is imported
try:
    logger.info("="*60)
    logger.info("LEGAL REACH RAG - VECTOR STORE INITIALIZATION")
    logger.info("="*60)
    
    vector_store, retriever = build_vectorstore()
    
    logger.info("="*60)
    logger.info("[OK] Vector store initialized successfully!")
    logger.info("="*60)
except Exception as e:
    logger.error(f"[ERROR] Failed to initialize vector store: {e}")
    logger.error("Make sure Ollama server is running on http://localhost:11434")
    raise
