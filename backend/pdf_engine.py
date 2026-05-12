from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
import tempfile
import os

# Initialize local embeddings and Chroma Vector DB
embedding_model = OllamaEmbeddings(model="nomic-embed-text")
vector_store = Chroma(embedding_function=embedding_model,
                      persist_directory="./chroma_db")


async def process_and_store_pdf(file: UploadFile):
    # DECLARE GLOBAL FIRST to fix the SyntaxError
    global vector_store

    # Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:   #NamedTemporaryFile is store in macos temp folder
        temp_file.write(await file.read())
        temp_path = temp_file.name

    try:
        # 1. Load the PDF
        loader = PyPDFLoader(temp_path)
        documents = loader.load()   #stores the extracted text

        # 2. Split into efficient chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,  #to maintain context we overlap 200char from previous chunk like 2nd chunk start at 800th char
            separators=["\n\n", "\n", " ", ""]  #The priority list for where to cut. Double newline (paragraph) first, single newline next, space last.
        )
        chunks = text_splitter.split_documents(documents)

        # 3. Store embeddings in Vector DB
        # Clears old documents if you only want to chat with one PDF at a time
        vector_store.delete_collection()

        # Re-initialize the vector store after deletion
        vector_store = Chroma(
            embedding_function=embedding_model, persist_directory="./chroma_db")
        vector_store.add_documents(chunks)

        return {"message": "PDF processed successfully", "chunks_created": len(chunks)}
    finally:
        os.remove(temp_path)


#to get user question
def get_pdf_context(query: str, k: int = 3):
    #Sets the default number of chunks to retrieve to 3, k=3
    # Retrieve top k most relevant chunks
    try:
        results = vector_store.similarity_search(query, k=k)  #similarity_search is a method provided by Chroma to find the most relevant chunks
        context = "\n\n".join([doc.page_content for doc in results])
        return context
    except Exception:
        return ""
