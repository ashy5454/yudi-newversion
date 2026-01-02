"""
Gemini Chat Service - Long Context Memory Integration
Uses Gemini 2.5's 1M token window for perfect memory recall
"""

import os
import requests
from typing import List, Dict, Optional, Any

def get_gemini_api_key() -> Optional[str]:
    """Get Gemini API key from environment"""
    return os.getenv('GEMINI_API_KEY')


def build_yudi_prompt(language: str, emotion: str) -> str:
    """
    Build Yudi's system prompt based on language and detected emotion
    
    Args:
        language: Language code ('en', 'hi', 'te')
        emotion: Detected emotion ('lonely', 'anxious', 'sad', 'happy', etc.)
        
    Returns:
        System prompt string
    """
    base = "You are Yudi, an empathetic AI companion designed for Gen-Z. You provide emotional support, listen actively, and respond with warmth and understanding. You remember everything users share with you and reference past conversations naturally."
    
    language_guides = {
        'hi': "Respond in Hindi or Hinglish (Hindi-English mix). Use natural slangs like 'bhai', 'yaar', 'arre'. Be warm and conversational. Mix English words naturally when it feels right.",
        'en': "Respond in English. Be warm, friendly, and authentic. Use Gen-Z language naturally when appropriate.",
        'te': "Respond in Telugu. Use natural Telugu expressions. Be warm and caring."
    }
    
    emotion_guides = {
        'lonely': "The user feels isolated or lonely. Validate their feelings. Suggest ways to connect with others. Be caring and supportive. Ask follow-up questions to understand their situation better.",
        'anxious': "The user is anxious or worried. Help ground them with calming techniques. Offer practical suggestions. Be reassuring and present.",
        'sad': "The user is sad or upset. Listen with empathy. Ask clarifying questions to understand what's bothering them. Offer comfort without being pushy.",
        'angry': "The user is angry or frustrated. Acknowledge their feelings. Help them process what's making them angry. Be understanding.",
        'happy': "The user is happy or excited. Celebrate with them genuinely. Ask about what's making them happy. Share their joy.",
        'neutral': "The user seems neutral. Be warm and engaging. Ask open-ended questions to understand how they're feeling."
    }
    
    language_guide = language_guides.get(language, language_guides['en'])
    emotion_guide = emotion_guides.get(emotion, emotion_guides['neutral'])
    
    return f"{base}\n\n{language_guide}\n\n{emotion_guide}"


def format_conversations(conversations: List[Dict[str, Any]]) -> str:
    """
    Format conversation history for Gemini prompt
    
    Args:
        conversations: List of conversation dictionaries from Pinecone
        
    Returns:
        Formatted string with conversation history
    """
    if not conversations:
        return "No previous conversations."
    
    formatted = []
    
    for i, conv in enumerate(conversations, 1):
        user_msg = conv.get('user_message', '')
        yudi_resp = conv.get('yudi_response', '')
        emotion = conv.get('emotion', 'unknown')
        timestamp = conv.get('timestamp', 0)
        
        # Format timestamp if available
        if timestamp:
            from datetime import datetime
            try:
                dt = datetime.fromtimestamp(timestamp)
                time_str = dt.strftime("%Y-%m-%d %H:%M")
            except:
                time_str = "recent"
        else:
            time_str = "recent"
        
        formatted.append(f"""
Conversation #{i} ({time_str}):
User: {user_msg}
Yudi: {yudi_resp}
Mood: {emotion}
---""")
    
    return "\n".join(formatted)


def estimate_tokens(text: str) -> int:
    """
    Rough token estimation (1 token ≈ 4 characters for English)
    This is a simple estimate - Gemini uses subword tokenization
    """
    return len(text) // 4


def truncate_conversations(conversations: List[Dict[str, Any]], max_tokens: int = 900000) -> List[Dict[str, Any]]:
    """
    Truncate conversations if they exceed token limit
    
    Args:
        conversations: List of conversations
        max_tokens: Maximum tokens allowed (default 900K to leave room for system prompt)
        
    Returns:
        Truncated list (keeps most recent conversations)
    """
    if not conversations:
        return conversations
    
    # Estimate total tokens
    total_text = format_conversations(conversations)
    total_tokens = estimate_tokens(total_text)
    
    if total_tokens <= max_tokens:
        return conversations
    
    # If too long, keep most recent conversations (reverse order, take from end)
    # Conversations are typically returned most recent first
    truncated = []
    current_tokens = 0
    
    for conv in conversations:
        conv_text = f"User: {conv.get('user_message', '')}\nYudi: {conv.get('yudi_response', '')}\n"
        conv_tokens = estimate_tokens(conv_text)
        
        if current_tokens + conv_tokens <= max_tokens:
            truncated.append(conv)
            current_tokens += conv_tokens
        else:
            break
    
    return truncated


def generate_response_with_history(
    user_message: str,
    conversation_history: List[Dict[str, Any]],
    language: str,
    emotion: str,
    gemini_api_key: Optional[str] = None,
    gemini_model: str = "gemini-2.0-flash-exp"
) -> str:
    """
    Generate Gemini response with full conversation history
    
    Args:
        user_message: Current user message
        conversation_history: List of past conversations from Pinecone
        language: Language code
        emotion: Detected emotion
        gemini_api_key: Gemini API key (if None, uses environment variable)
        gemini_model: Gemini model to use
        
    Returns:
        Generated response text
    """
    if not gemini_api_key:
        gemini_api_key = get_gemini_api_key()
    
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY not set")
    
    # Truncate conversations if needed (Gemini 2.5 has 1M tokens, but be safe)
    truncated_history = truncate_conversations(conversation_history, max_tokens=900000)
    
    # Build prompts
    system_prompt = build_yudi_prompt(language, emotion)
    formatted_history = format_conversations(truncated_history)
    
    full_prompt = f"""{system_prompt}

=== USER'S CONVERSATION HISTORY ===
{formatted_history}

=== CURRENT MESSAGE ===
User: {user_message}

Respond as Yudi:"""
    
    # Call Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent"
    
    payload = {
        "contents": [{
            "role": "user",
            "parts": [{"text": full_prompt}]
        }],
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        }
    }
    
    try:
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            params={"key": gemini_api_key},
            json=payload,
            timeout=60
        )
        
        if not response.ok:
            error_text = response.text
            try:
                error_data = response.json()
                error_text = error_data.get('error', {}).get('message', error_text)
            except:
                pass
            raise Exception(f"Gemini API error: {response.status_code} - {error_text}")
        
        data = response.json()
        generated_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        if not generated_text:
            raise Exception("No text generated from Gemini API")
        
        return generated_text.strip()
    
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to call Gemini API: {str(e)}")

