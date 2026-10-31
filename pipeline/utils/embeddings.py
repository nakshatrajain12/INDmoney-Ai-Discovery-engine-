"""
Embeddings and Vector Database Manager for AI Discovery Engine.
Integrates with ChromaDB and supports:
- OpenAI text-embedding-3-small (when OPENAI_API_KEY available)
- Sentence-Transformers / ChromaDB default local embeddings (offline fallback)
"""

import os
import sys
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

load_dotenv()

CHROMA_PERSIST_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "chromadb"
)

class EmbeddingManager:
    def __init__(self, collection_name: str = "sip_discovery_corpus", persist_dir: Optional[str] = None):
        self.persist_dir = persist_dir or CHROMA_PERSIST_DIR
        os.makedirs(self.persist_dir, exist_ok=True)
        
        import chromadb
        self.chroma_client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection_name = collection_name
        self.collection = self.chroma_client.get_or_create_collection(name=self.collection_name)
        print(f"[OK] Embedding Manager initialized! Collection: '{self.collection_name}' (DB path: {self.persist_dir})")

    def add_documents(
        self,
        ids: List[str],
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None
    ):
        """Adds or updates documents in the ChromaDB collection."""
        if not ids or not documents:
            return
        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

    def query(
        self,
        query_text: str,
        n_results: int = 5,
        where_filter: Optional[Dict] = None
    ) -> Dict:
        """Queries the vector database for semantically similar documents."""
        kwargs = {
            "query_texts": [query_text],
            "n_results": n_results
        }
        if where_filter:
            kwargs["where"] = where_filter
        return self.collection.query(**kwargs)

    def count(self) -> int:
        return self.collection.count()


if __name__ == "__main__":
    print("[*] Testing Embedding Manager...")
    mgr = EmbeddingManager(collection_name="test_collection")
    test_id = "test_001"
    test_doc = "I stopped my monthly SIP on INDmoney because of unclear returns."
    test_meta = {"source": "test", "action": "stopped"}
    
    mgr.add_documents(ids=[test_id], documents=[test_doc], metadatas=[test_meta])
    results = mgr.query("Why did the user cancel their investment?", n_results=1)
    print(f"[OK] Test Query Result: {results['documents'][0]}")

