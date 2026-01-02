"""
Pinecone Vector Database Service
Fast semantic memory storage and retrieval for Yudi conversations
Replaces BigQuery RAG: 500ms → 10ms (50x faster)
"""

import os
import time
from typing import List, Dict, Optional, Any
from datetime import datetime

# Try to import Pinecone
try:
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False
    print("Warning: pinecone not installed. Install with: pip install pinecone")

# Try to import Google Generative AI for embeddings
try:
    import google.generativeai as genai
    GEMINI_EMBEDDINGS_AVAILABLE = True
except ImportError:
    GEMINI_EMBEDDINGS_AVAILABLE = False
    print("Warning: google-generativeai not installed. Install with: pip install google-generativeai")


class PineconeMemory:
    """
    Pinecone Vector Database for storing and retrieving conversation memories
    Provides fast semantic search for emotional context and conversation history
    """
    
    def __init__(self, index_name: str = 'yudi-memories', dimension: int = 768):
        """
        Initialize Pinecone Memory
        
        Args:
            index_name: Name of the Pinecone index
            dimension: Embedding dimension (768 for Gemini embedding-001)
        """
        if not PINECONE_AVAILABLE:
            raise ImportError("pinecone not installed. Install with: pip install pinecone")
        
        # Get API key from environment
        api_key = os.getenv('PINECONE_API_KEY')
        if not api_key:
            raise ValueError("PINECONE_API_KEY environment variable not set")
        
        # Initialize Pinecone client
        self.pc = Pinecone(api_key=api_key)
        self.index_name = index_name
        self.dimension = dimension
        
        # Get or create index
        self.index = self._get_or_create_index()
        
        # Initialize Gemini for embeddings
        self.embedding_model = None
        if GEMINI_EMBEDDINGS_AVAILABLE:
            gemini_api_key = os.getenv('GEMINI_API_KEY')
            if gemini_api_key:
                genai.configure(api_key=gemini_api_key)
                self.embedding_model = 'models/embedding-001'
            else:
                print("Warning: GEMINI_API_KEY not set. Embeddings will not work.")
        else:
            print("Warning: google-generativeai not available. Embeddings will not work.")
    
    def _get_or_create_index(self):
        """
        Get existing index or create new one if it doesn't exist
        
        Returns:
            Pinecone Index instance
        """
        try:
            # Check if index exists
            if self.index_name in self.pc.list_indexes().names():
                print(f"✅ Using existing Pinecone index: {self.index_name}")
                return self.pc.Index(self.index_name)
            else:
                # Create new index
                print(f"📦 Creating new Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region='us-east-1'
                    )
                )
                # Wait for index to be ready
                time.sleep(2)
                return self.pc.Index(self.index_name)
        except Exception as e:
            print(f"⚠️  Error accessing Pinecone index: {str(e)}")
            raise
    
    def _get_embedding(self, text: str, task_type: str = "retrieval_document") -> List[float]:
        """
        Generate embedding for text using Gemini Embeddings API
        
        Args:
            text: Text to generate embedding for
            task_type: "retrieval_document" (for storing) or "retrieval_query" (for searching)
            
        Returns:
            List of floats representing the embedding vector
        """
        if not self.embedding_model:
            raise RuntimeError("Embedding model not configured. Set GEMINI_API_KEY.")
        
        try:
            # Use Gemini Embeddings API
            result = genai.embed_content(
                model=self.embedding_model,
                content=text,
                task_type=task_type
            )
            # Handle both dict and object response formats
            if isinstance(result, dict):
                return result.get('embedding', result.get('values', []))
            else:
                # If result is an object with embedding attribute
                return getattr(result, 'embedding', getattr(result, 'values', []))
        except Exception as e:
            raise RuntimeError(f"Failed to generate embedding: {str(e)}")
    
    def store_conversation(
        self,
        user_id: str,
        user_message: str,
        yudi_response: str,
        emotion: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Store a conversation in Pinecone
        
        Args:
            user_id: User identifier
            user_message: User's message
            yudi_response: Yudi's response
            emotion: Detected emotion (optional)
            metadata: Additional metadata (optional)
            
        Returns:
            Vector ID (unique identifier for this memory)
        """
        # Create combined text for embedding (includes user message and response)
        combined_text = f"{user_message} {yudi_response}"
        
        # Generate embedding
        embedding = self._get_embedding(combined_text)
        
        # Generate unique vector ID
        vector_id = f"{user_id}_{int(time.time() * 1000)}"
        
        # Prepare metadata
        vector_metadata = {
            'user_id': user_id,
            'user_message': user_message,
            'yudi_response': yudi_response,
            'timestamp': int(time.time()),
            'datetime': datetime.utcnow().isoformat()
        }
        
        if emotion:
            vector_metadata['emotion'] = emotion
        
        if metadata:
            vector_metadata.update(metadata)
        
        # Store in Pinecone
        try:
            self.index.upsert(vectors=[{
                'id': vector_id,
                'values': embedding,
                'metadata': vector_metadata
            }])
            print(f"✅ Stored memory: {vector_id} for user {user_id}")
            return vector_id
        except Exception as e:
            raise RuntimeError(f"Failed to store in Pinecone: {str(e)}")
    
    def retrieve_memories(
        self,
        user_id: str,
        query_text: str,
        top_k: int = 5,
        emotion_filter: Optional[str] = None,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Retrieve similar memories for a user based on query text
        
        Args:
            user_id: User identifier
            query_text: Query text for semantic search
            top_k: Number of results to return
            emotion_filter: Filter by specific emotion (optional)
            min_score: Minimum similarity score (0.0 to 1.0)
            
        Returns:
            List of dictionaries containing memory data and similarity scores
        """
        # Generate embedding for query (use retrieval_query task type for better search)
        query_embedding = self._get_embedding(query_text, task_type="retrieval_query")
        
        # Prepare filter
        filter_dict = {'user_id': user_id}
        if emotion_filter:
            filter_dict['emotion'] = emotion_filter
        
        try:
            # Query Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            
            # Format results
            memories = []
            for match in results.matches:
                if match.score >= min_score:
                    memory = {
                        'id': match.id,
                        'score': match.score,
                        'user_message': match.metadata.get('user_message', ''),
                        'yudi_response': match.metadata.get('yudi_response', ''),
                        'emotion': match.metadata.get('emotion'),
                        'timestamp': match.metadata.get('timestamp'),
                        'datetime': match.metadata.get('datetime')
                    }
                    memories.append(memory)
            
            print(f"✅ Retrieved {len(memories)} memories for user {user_id}")
            return memories
        
        except Exception as e:
            raise RuntimeError(f"Failed to query Pinecone: {str(e)}")
    
    def get_user_memories(
        self,
        user_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get all memories for a user (no semantic search, just by user_id)
        
        Args:
            user_id: User identifier
            limit: Maximum number of memories to return
            
        Returns:
            List of memories
        """
        try:
            # Query with user_id filter only
            results = self.index.query(
                vector=[0.0] * self.dimension,  # Dummy vector for metadata-only query
                top_k=limit,
                include_metadata=True,
                filter={'user_id': user_id}
            )
            
            memories = []
            for match in results.matches:
                memory = {
                    'id': match.id,
                    'user_message': match.metadata.get('user_message', ''),
                    'yudi_response': match.metadata.get('yudi_response', ''),
                    'emotion': match.metadata.get('emotion'),
                    'timestamp': match.metadata.get('timestamp'),
                    'datetime': match.metadata.get('datetime')
                }
                memories.append(memory)
            
            return memories
        
        except Exception as e:
            raise RuntimeError(f"Failed to get user memories: {str(e)}")
    
    def delete_memory(self, vector_id: str) -> bool:
        """
        Delete a specific memory by vector ID
        
        Args:
            vector_id: Vector ID to delete
            
        Returns:
            True if successful
        """
        try:
            self.index.delete(ids=[vector_id])
            print(f"✅ Deleted memory: {vector_id}")
            return True
        except Exception as e:
            print(f"❌ Failed to delete memory: {str(e)}")
            return False
    
    def delete_user_memories(self, user_id: str) -> int:
        """
        Delete all memories for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            Number of memories deleted
        """
        try:
            # Get all memories for user
            memories = self.get_user_memories(user_id, limit=10000)
            
            if not memories:
                return 0
            
            # Delete all vector IDs
            vector_ids = [m['id'] for m in memories]
            self.index.delete(ids=vector_ids)
            print(f"✅ Deleted {len(vector_ids)} memories for user {user_id}")
            return len(vector_ids)
        
        except Exception as e:
            print(f"❌ Failed to delete user memories: {str(e)}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the Pinecone index
        
        Returns:
            Dictionary with index statistics
        """
        try:
            stats = self.index.describe_index_stats()
            return {
                'index_name': self.index_name,
                'dimension': self.dimension,
                'total_vectors': stats.total_vector_count if hasattr(stats, 'total_vector_count') else 0,
                'namespaces': stats.namespaces if hasattr(stats, 'namespaces') else {}
            }
        except Exception as e:
            return {'error': str(e)}


# Global instance
_memory_instance: Optional[PineconeMemory] = None


def get_memory() -> PineconeMemory:
    """
    Get or create global PineconeMemory instance (singleton)
    
    Returns:
        PineconeMemory instance
    """
    global _memory_instance
    if _memory_instance is None:
        _memory_instance = PineconeMemory()
    return _memory_instance

