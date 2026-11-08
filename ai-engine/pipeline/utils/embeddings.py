"""
Embeddings and Vector Database Manager for AI Discovery Engine.
Integrates with ChromaDB and supports:
- Embedding of extracted corpus into ChromaDB
- Local onnx / default Chroma embeddings or OpenAI embeddings
"""

import os
import sys
import json
import argparse
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

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
        """Adds or updates documents in the ChromaDB collection in chunks."""
        if not ids or not documents:
            return
        
        chunk_size = 200
        for i in range(0, len(ids), chunk_size):
            chunk_ids = ids[i:i + chunk_size]
            chunk_docs = documents[i:i + chunk_size]
            chunk_metas = metadatas[i:i + chunk_size] if metadatas else None
            self.collection.upsert(
                ids=chunk_ids,
                documents=chunk_docs,
                metadatas=chunk_metas
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


def index_extracted_insights(input_path: str, persist_dir: Optional[str] = None):
    print(f"[*] Pre-embedding extracted corpus into ChromaDB from: {input_path}")
    if not os.path.exists(input_path):
        print(f"[!] Input file {input_path} not found.")
        return

    mgr = EmbeddingManager(collection_name="sip_discovery_corpus", persist_dir=persist_dir)
    
    ids = []
    docs = []
    metas = []

    with open(input_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                rec_id = rec.get("id")
                text = rec.get("text", "")
                quote = rec.get("key_quote", "")
                
                # Document representation combines quote and text
                doc_text = f"{quote}\n{text}" if quote else text
                if not rec_id or not doc_text:
                    continue

                ids.append(rec_id)
                docs.append(doc_text[:500])
                
                # Chroma metadata only accepts str, int, float, bool
                meta = {
                    "source": str(rec.get("source", "")),
                    "platform_app": str(rec.get("platform_app", "INDmoney")),
                    "rating": int(rec.get("rating") or 0),
                    "emotion": str(rec.get("emotion", {}).get("primary", "unknown")),
                    "action": str(rec.get("behavioral_action", {}).get("action_taken", "none")),
                    "friction": str(rec.get("friction_point", {}).get("product_area", "none"))
                }
                metas.append(meta)
            except Exception:
                continue

    print(f"[*] Upserting {len(ids):,} documents into ChromaDB...")
    mgr.add_documents(ids=ids, documents=docs, metadatas=metas)
    print(f"[OK] ChromaDB Indexing Complete! Total Indexed Count: {mgr.count():,}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ChromaDB Corpus Embeddings Manager")
    parser.add_argument("--input", type=str, default=None, help="Path to extracted_insights.jsonl")
    parser.add_argument("--output", type=str, default=None, help="Path to Chroma persist directory")
    args = parser.parse_args()

    default_input = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "data", "extracted", "extracted_insights.jsonl"
    )
    in_file = args.input or default_input
    index_extracted_insights(in_file, persist_dir=args.output)
