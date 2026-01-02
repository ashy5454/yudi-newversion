"""
Flask Backend Server - Pinecone Memory Service
Provides REST API for storing and retrieving conversation memories in Pinecone
Note: Voice calls use Gemini Live API (frontend-only), no backend needed
"""

import os
import traceback
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables from .env file in project root
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"✅ Loaded environment variables from {env_path}")
    else:
        print(f"⚠️  Warning: .env file not found at {env_path}")
except ImportError:
    print("⚠️  Warning: python-dotenv not installed. Install it with: pip install python-dotenv")
except Exception as e:
    print(f"⚠️  Warning: Failed to load .env file: {e}")

# Import Pinecone Memory Service (ONLY service needed - used by text chat)
try:
    from services.vector_db import PineconeMemory
    VECTOR_DB_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Warning: Could not import vector_db: {e}")
    VECTOR_DB_AVAILABLE = False
    PineconeMemory = None

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Initialize Pinecone Memory (used for text chat memory storage/retrieval)
print("Initializing Pinecone Memory Service...")
try:
    if VECTOR_DB_AVAILABLE and PineconeMemory:
        memory_db = PineconeMemory()
        print("✅ Pinecone Memory Service ready!")
    else:
        memory_db = None
        print("⚠️  Pinecone Memory not available (VECTOR_DB_AVAILABLE=False)")
except Exception as e:
    print(f"❌ Pinecone Memory initialization failed: {e}")
    memory_db = None


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'pinecone-memory',
        'pinecone_available': memory_db is not None
    }), 200


@app.route('/api/memories/store', methods=['POST'])
def store_memory():
    """Store a conversation memory in Pinecone"""
    if memory_db is None:
        return jsonify({
            'success': False,
            'error': 'Pinecone Memory not available. Set PINECONE_API_KEY environment variable.'
        }), 503
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Request body must be JSON'}), 400
        
        user_id = data.get('user_id')
        user_message = data.get('user_message', '').strip()
        yudi_response = data.get('yudi_response', '').strip()
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400
        if not user_message or not yudi_response:
            return jsonify({'success': False, 'error': 'user_message and yudi_response are required'}), 400
        
        memory_id = memory_db.store_conversation(
            user_id=user_id,
            user_message=user_message,
            yudi_response=yudi_response,
            emotion=data.get('emotion'),
            metadata=data.get('metadata', {})
        )
        
        return jsonify({
            'success': True,
            'memory_id': memory_id,
            'message': 'Memory stored successfully'
        }), 200
    except Exception as e:
        print(f"Memory store error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': f'Failed to store memory: {str(e)}'}), 500


@app.route('/api/memories/<user_id>', methods=['GET'])
def retrieve_memories(user_id: str):
    """Retrieve similar memories for a user"""
    if memory_db is None:
        return jsonify({
            'success': False,
            'error': 'Pinecone Memory not available. Set PINECONE_API_KEY environment variable.'
        }), 503
    
    try:
        query_text = request.args.get('query', '').strip()
        top_k = min(int(request.args.get('top_k', 5)), 100)
        emotion_filter = request.args.get('emotion')
        min_score = float(request.args.get('min_score', 0.0))
        
        if query_text:
            memories = memory_db.retrieve_memories(
                user_id=user_id, query_text=query_text, top_k=top_k,
                emotion_filter=emotion_filter, min_score=min_score
            )
        else:
            memories = memory_db.get_user_memories(user_id, limit=top_k)
            memories = [{
                'id': m.get('id'), 'score': None,
                'user_message': m.get('user_message'),
                'yudi_response': m.get('yudi_response'),
                'emotion': m.get('emotion'),
                'timestamp': m.get('timestamp'),
                'datetime': m.get('datetime')
            } for m in memories]
        
        return jsonify({'success': True, 'memories': memories, 'count': len(memories)}), 200
    except Exception as e:
        print(f"Memory retrieval error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': f'Failed to retrieve memories: {str(e)}'}), 500


@app.route('/api/memories/<user_id>/delete', methods=['DELETE'])
def delete_user_memories(user_id: str):
    """Delete all memories for a user"""
    if memory_db is None:
        return jsonify({
            'success': False,
            'error': 'Pinecone Memory not available. Set PINECONE_API_KEY environment variable.'
        }), 503
    
    try:
        deleted_count = memory_db.delete_user_memories(user_id)
        return jsonify({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'Deleted {deleted_count} memories for user {user_id}'
        }), 200
    except Exception as e:
        print(f"Memory deletion error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': f'Failed to delete memories: {str(e)}'}), 500


@app.route('/api/memories/stats', methods=['GET'])
def memory_stats():
    """Get Pinecone index statistics"""
    if memory_db is None:
        return jsonify({
            'success': False,
            'error': 'Pinecone Memory not available. Set PINECONE_API_KEY environment variable.'
        }), 503
    
    try:
        stats = memory_db.get_stats()
        return jsonify({'success': True, 'stats': stats}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get stats: {str(e)}'}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    # Run Flask development server
    port = int(os.environ.get('PORT', 5002))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Starting Pinecone Memory Service on port {port}")
    print(f"   Debug mode: {debug}")
    print(f"   Health check: http://localhost:{port}/health")
    print(f"   Pinecone Memory endpoints:")
    print(f"     - POST /api/memories/store")
    print(f"     - GET /api/memories/<user_id>?query=text&top_k=5")
    print(f"     - DELETE /api/memories/<user_id>/delete")
    print(f"     - GET /api/memories/stats")
    if not memory_db:
        print(f"     (Note: Endpoints will return 503 until PINECONE_API_KEY is set)")
    print(f"")
    print(f"✅ Voice calls use Gemini Live API (frontend-only, no backend needed)")

    app.run(host='0.0.0.0', port=port, debug=debug)
