"""
Configuration file for Legal Reach RAG Chatbot
"""

import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

#  PATHS 
BASE_DIR = Path(__file__).parent
LEGAL_DOCS_DIR = BASE_DIR / "legal_documents"
LEGAL_PDFS_DIR = LEGAL_DOCS_DIR / "pdfs"
LEGAL_DOCX_DIR = LEGAL_DOCS_DIR / "docx"
LEGAL_TXT_DIR = LEGAL_DOCS_DIR / "txt"
VECTORSTORE_DIR = BASE_DIR / "vectorstore"
LOGS_DIR = BASE_DIR / "logs"

# Create directoriest
for directory in [LEGAL_PDFS_DIR, LEGAL_DOCX_DIR, LEGAL_TXT_DIR, VECTORSTORE_DIR, LOGS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)


# GPU CONFIGURATION 
@dataclass
class GPUConfig:
    """
    RTX 3050 Specifications:
    - VRAM: 4GB
    - CUDA Compute Capability: 8.6
    - Memory Bandwidth: 288 GB/s
    
    Our Strategy:
    - Embeddings: On GPU (0.2GB) - sentence-transformers
    - LLM: On CPU or partial GPU (depends on Ollama)
    - Vector Store: In Memory (0.5-1GB)
    - Buffer: 1GB for system stability
    """
    
    device: str = "cpu"  # Using Ollama for LLM, 
    max_gpu_memory: str = "3.5GB"  # Leave 0.5GB for system
    quantization_8bit: bool = True  # Reduce model size by 50%
    mixed_precision: bool = True  # FP16 for faster inference
    batch_size: int = 4  # Embeddings per batch
    
    # Memory thresholds
    memory_warning_threshold: float = 0.80  # Warn if 80% used
    memory_critical_threshold: float = 0.90  # Panic if 90% used
    temp_warning: float = 70.0  # Celsius
    temp_critical: float = 80.0  # Celsius
    
    def __post_init__(self):
        """Validate CUDA availability and set fallback"""
        if self.device == "cuda":
            try:
                torch.cuda.is_available()
                print(f"✅ CUDA Device: {torch.cuda.get_device_name(0)}")
                print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f}GB")
            except Exception as e:
                print(f"⚠️ CUDA Error: {e}. Falling back to CPU.")
                self.device = "cpu"


# MODEL CONFIGURATION 
@dataclass
class ModelConfig:
    """
    Model Selection for RTX 3050 + Legal Documents
    
    Embedding Model:
    - sentence-transformers/all-MiniLM-L6-v2: 80MB, fast, good quality
    - Alternative if OOM: all-MiniLM-L12-v2 (120MB)
    
    LLM:
    - Ollama llama3.2 (via OllamaLLM) - managed by Ollama server
    - Runs on CPU or partial GPU based on Ollama config
    - You configure this in Ollama separately
    """
    
    # Embeddings (runs on GPU via sentence-transformers)
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384  # Output size of embeddings
    embedding_batch_size: int = 32  # How many texts to embed at once
    
    # LLM (managed by Ollama)
    llm_model: str = "llama3.2"  
    ollama_base_url: str = "http://localhost:11434"  # Ollama server URL
    
    # Generation parameters
    max_tokens: int = 512
    temperature: float = 0.1  # Lower = more deterministic (good for legal)
    top_p: float = 0.9  # Nucleus sampling
    top_k: int = 50


# DOCUMENT CONFIGURATION 
@dataclass
class DocumentConfig:
    """
    Settings for document processing
    Optimized for legal documents (contracts, briefs, etc.)
    """
    
    # Chunking strategy 
    chunk_size: int = 512  # tokens per chunk
    chunk_overlap: int = 50  # tokens of overlap between chunks
    
    # File handling
    max_file_size: int = 50_000_000  # 50MB max per file
    supported_formats: list = None
    
    # Processing
    extract_tables: bool = True  # From PDF/DOCX
    preserve_formatting: bool = True
    remove_page_breaks: bool = True
    
    # Metadata
    store_filename: bool = True
    store_page_numbers: bool = True
    store_upload_date: bool = True
    
    def __post_init__(self):
        if self.supported_formats is None:
            self.supported_formats = ['.pdf', '.docx', '.txt']


# VECTOR STORE CONFIGURATION 
@dataclass
class VectorStoreConfig:
    """
    Chroma DB configuration for legal documents
    """
    
    # Store type (we use Chroma like your existing setup)
    collection_name: str = "legal_documents"
    persist_directory: str = str(VECTORSTORE_DIR)
    
    # Search settings
    retrieval_k: int = 4  # Top 4 chunks for legal context
    distance_metric: str = "cosine"  # Similarity metric
    
    # For future FAISS option:
    faiss_index_type: str = "Flat"  # Simple index (no approximation)


# ==================== LEGAL PROMPT TEMPLATE ====================
LEGAL_SYSTEM_PROMPT = """You are an expert legal assistant trained to analyze legal documents.

Your responsibilities:
1. Answer questions based ONLY on the provided legal documents
2. Always cite the specific document name and page number as your source
3. If the answer is not in the documents, clearly state: "This information is not available in the provided documents."
4. Use clear, professional legal language
5. Explain complex legal terms when necessary
6. Never provide personal legal advice - only provide information from documents
7. Highlight any ambiguities or contradictions in the documents

When answering:
- Be precise and cite sources
- Use proper legal terminology
- Structure answers clearly with sections if needed
- Always indicate your confidence level (e.g., "Based on [Document Name], page X...")

Format your response as:
[ANSWER]
- Direct answer to the question
- Supporting points from documents

[SOURCES]
- Document Name, Page X, Relevance: Y%
- Document Name, Page Z, Relevance: W%
"""

LEGAL_QUESTION_TEMPLATE = """Based on these legal documents:

{context}

Question: {question}

Provide a detailed answer citing specific documents and page numbers."""


#  COMBINE ALL CONFIGS 
@dataclass
class LegalReachConfig:
    """Main configuration class combining all settings"""
    
    gpu: GPUConfig = None
    model: ModelConfig = None
    document: DocumentConfig = None
    vectorstore: VectorStoreConfig = None
    
    def __post_init__(self):
        if self.gpu is None:
            self.gpu = GPUConfig()
        if self.model is None:
            self.model = ModelConfig()
        if self.document is None:
            self.document = DocumentConfig()
        if self.vectorstore is None:
            self.vectorstore = VectorStoreConfig()


# --------------- LOAD ENVIRONMENT VARIABLES ----------------------
def load_config_from_env() -> LegalReachConfig:
    """
    Load configuration from .env file if it exists
    Otherwise use defaults
    """
    from dotenv import load_dotenv
    
    # Try to load .env
    env_file = BASE_DIR / ".env"
    if env_file.exists():
        load_dotenv(env_file)
    
    # Create config
    config = LegalReachConfig()
    
    # Override with environment variables if they exist
    if os.getenv("EMBEDDING_MODEL"):
        config.model.embedding_model = os.getenv("EMBEDDING_MODEL")
    
    if os.getenv("LLM_MODEL"):
        config.model.llm_model = os.getenv("LLM_MODEL")
    
    if os.getenv("CHUNK_SIZE"):
        config.document.chunk_size = int(os.getenv("CHUNK_SIZE"))
    
    if os.getenv("TEMPERATURE"):
        config.model.temperature = float(os.getenv("TEMPERATURE"))
    
    if os.getenv("DEVICE"):
        requested_device = os.getenv("DEVICE").lower()
        # Always use CPU since we're using Ollama for inference
        config.gpu.device = "cpu"
    
    return config


#DEFAULT CONFIG INSTANCE 
# This is what other modules will import
DEFAULT_CONFIG = load_config_from_env()


#  TROUBLESHOOTING PRESETS 
def get_config_for_low_memory() -> LegalReachConfig:
    """
    Preset for if you get GPU Out of Memory errors
    """
    config = LegalReachConfig()
    config.model.embedding_batch_size = 16  # Reduce from 32
    config.document.chunk_size = 256  # Reduce from 512
    config.document.chunk_overlap = 25  # Reduce from 50
    config.model.max_tokens = 256  # Reduce from 512
    config.gpu.batch_size = 2  # Reduce from 4
    return config


def get_config_for_fast_inference() -> LegalReachConfig:
    """
    Preset for faster responses (may use more GPU memory)
    """
    config = LegalReachConfig()
    config.model.embedding_batch_size = 64  # Increase from 32
    config.gpu.batch_size = 8  # Increase from 4
    return config


#  VALIDATION
if __name__ == "__main__":
    """Verify configuration"""
    config = DEFAULT_CONFIG
    
    print("\n" + "="*50)
    print("LEGAL REACH RAG - CONFIGURATION CHECK")
    print("="*50)
    
    print("\n PATHS:")
    print(f"  Base Dir: {BASE_DIR}")
    print(f"  Legal Docs: {LEGAL_DOCS_DIR}")
    print(f"  Vector Store: {VECTORSTORE_DIR}")
    
    print("\n GPU SETTINGS:")
    print(f"  Device: {config.gpu.device}")
    print(f"  Max Memory: {config.gpu.max_gpu_memory}")
    print(f"  8-bit Quantization: {config.gpu.quantization_8bit}")
    
    print("\n MODEL SETTINGS:")
    print(f"  Embedding Model: {config.model.embedding_model}")
    print(f"  LLM Model (Ollama): {config.model.llm_model}")
    print(f"  Max Tokens: {config.model.max_tokens}")
    print(f"  Temperature: {config.model.temperature}")
    
    print("\n DOCUMENT SETTINGS:")
    print(f"  Chunk Size: {config.document.chunk_size} tokens")
    print(f"  Chunk Overlap: {config.document.chunk_overlap} tokens")
    print(f"  Max File Size: {config.document.max_file_size / 1e6:.1f} MB")
    
    print("\n VECTOR STORE SETTINGS:")
    print(f"  Collection: {config.vectorstore.collection_name}")
    print(f"  Retrieval K: {config.vectorstore.retrieval_k}")
    print(f"  Distance Metric: {config.vectorstore.distance_metric}")
    
    print("\n Configuration loaded successfully!")
    print("="*50 + "\n")
