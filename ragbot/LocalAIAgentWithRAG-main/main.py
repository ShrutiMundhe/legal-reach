"""
Legal Reach RAG - AI Legal Assistant
Retrieves information from legal documents and generates answers using Ollama LLM
"""

import sys
import os

if sys.version_info >= (3, 14):
    def patch_pydantic_v1():
        """Patch pydantic.v1 to handle Python 3.14 better"""
        try:
            import pydantic.v1.validators as validators
            original_find = validators.find_validators
            
            def patched_find_validators(type_, config):
                """Find validators with fallback for unknown types"""
                try:
                    yield from original_find(type_, config)
                except RuntimeError as e:
                    if "no validator found" in str(e):
                        # For unknown types, use a generic validator
                        yield lambda v: v
                    else:
                        raise
            
            validators.find_validators = patched_find_validators
        except Exception:
            pass  # If patching fails, continue anyway
    
    patch_pydantic_v1()

# Now safe to import langchain


import logging
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize LLM
logger.info("[LLM] Initializing Ollama LLM (llama3.2)...")
model = OllamaLLM(model="llama3.2")
logger.info("[OK] LLM initialized")

# Legal-specific prompt template
legal_template = """You are a legal document explainer. Write in simple English that an 8th-grade student can understand.

Your responsibilities:
1. Answer questions based ONLY on the provided legal documents
2. Always cite the specific document name and page number as your source
3. If the answer is not in the documents, clearly state: "This information is not available in the provided documents."
4. Keep language simple and short
5. Explain legal terms in plain words
6. Never provide personal legal advice - only provide information from documents
7. Keep the answer user-friendly with short sections

Legal Documents Context:
{context}

User Question: {question}

Respond in this format:
1) Quick Answer (2-4 lines)
2) Easy Explanation (short bullet points)
3) Sources (document + page number)"""

prompt = ChatPromptTemplate.from_template(legal_template)
chain = prompt | model


def format_documents(docs):
    """
    Format retrieved documents for context
    
    Args:
        docs: List of Document objects from retriever
        
    Returns:
        Formatted string with document content and metadata
    """
    formatted = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get('source', 'Unknown')
        page = doc.metadata.get('page', 'N/A')
        content = doc.page_content[:180]  # Keep context shorter for faster generation
        
        formatted.append(f"[Document {i}] {source} (Page {page}):\n{content}...")
    
    return "\n\n".join(formatted)


def answer_legal_question(question):
    """
    Answer a legal question using the RAG pipeline
    
    Args:
        question: User's legal question
        
    Returns:
        str: Answer with sources
    """
    logger.info(f"[QUERY] Question: {question}")
    
    # Retrieve relevant documents
    logger.info("[SEARCH] Searching legal documents...")
    retrieved_docs = retriever.invoke(question)
    
    if not retrieved_docs:
        logger.warning("[WARNING] No relevant documents found")
        return "No relevant legal documents found for this query."
    
    logger.info(f"[OK] Found {len(retrieved_docs)} relevant document chunks")
    
    # Format documents for context
    context = format_documents(retrieved_docs)
    
    # Generate answer using LLM
    logger.info("[GENERATING] Generating answer...")
    result = chain.invoke({"context": context, "question": question})
    
    logger.info("[OK] Answer generated")
    
    # Add source information
    answer_with_sources = f"{result}\n\n--- SOURCES ---\n"
    for doc in retrieved_docs[:3]:  # Show top 3 sources
        source = doc.metadata.get('source', 'Unknown')
        page = doc.metadata.get('page', 'N/A')
        answer_with_sources += f"• {source} (Page {page})\n"
    
    return answer_with_sources


def main():
    """Main chat loop"""
    logger.info("="*60)
    logger.info("LEGAL REACH RAG - AI LEGAL ASSISTANT")
    logger.info("="*60)
    logger.info("Ask your legal questions. Type 'q' to quit.\n")
    
    while True:
        question = input("\n[QUERY] Ask your legal question (q to quit): ").strip()
        
        if question.lower() == 'q':
            logger.info(" Goodbye!")
            break
        
        if not question:
            print("Please enter a valid question.")
            continue
        
        print("\n" + "="*60)
        answer = answer_legal_question(question)
        print(answer)
        print("="*60)


if __name__ == "__main__":
    main()
