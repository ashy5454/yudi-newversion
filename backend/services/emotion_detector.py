"""
Emotion Detection Service
Simple keyword-based emotion detection for Gen-Z emotional support
"""

import re
from typing import Dict, Optional, Literal

# Emotion keywords by language
EMOTION_KEYWORDS = {
    'lonely': {
        'en': ['lonely', 'alone', 'isolated', 'by myself', 'no one', 'empty', 'disconnected'],
        'hi': ['अकेला', 'अकेली', 'अकेले', 'तन्हा', 'एकाकी'],
        'te': ['ఒంటరిగా', 'ఏకాంతం', 'ఒంటరితనం']
    },
    'anxious': {
        'en': ['anxious', 'worried', 'stressed', 'nervous', 'panic', 'overwhelmed', 'scared'],
        'hi': ['चिंतित', 'परेशान', 'तनाव', 'घबराया'],
        'te': ['ఆందోళన', 'చింతించు', 'భయపడ్డ']
    },
    'sad': {
        'en': ['sad', 'depressed', 'down', 'upset', 'hurt', 'crying', 'miserable'],
        'hi': ['उदास', 'दुखी', 'दुख', 'रोना'],
        'te': ['విచారంగా', 'విచారం', 'బాధ']
    },
    'angry': {
        'en': ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated'],
        'hi': ['गुस्सा', 'नाराज', 'क्रोधित'],
        'te': ['కోపం', 'కోపంగా']
    },
    'happy': {
        'en': ['happy', 'excited', 'joyful', 'great', 'awesome', 'amazing', 'wonderful'],
        'hi': ['खुश', 'खुशी', 'आनंद', 'मस्त'],
        'te': ['సంతోషం', 'ఆనందం', 'సంతోషంగా']
    },
    'neutral': {
        'en': ['okay', 'ok', 'fine', 'alright', 'normal'],
        'hi': ['ठीक', 'ठीक है', 'सामान्य'],
        'te': ['సరే', 'బాగా']
    }
}


def detect_emotion(text: str, language: str = 'en') -> str:
    """
    Detect emotion from text using keyword matching
    
    Args:
        text: User's message text
        language: Language code ('en', 'hi', 'te')
        
    Returns:
        Emotion string: 'lonely', 'anxious', 'sad', 'angry', 'happy', or 'neutral'
    """
    if not text:
        return 'neutral'
    
    text_lower = text.lower()
    emotion_scores = {}
    
    # Score each emotion based on keyword matches
    for emotion, keywords_by_lang in EMOTION_KEYWORDS.items():
        score = 0
        keywords = keywords_by_lang.get(language, []) + keywords_by_lang.get('en', [])
        
        for keyword in keywords:
            # Use word boundaries for better matching
            pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
            matches = len(re.findall(pattern, text_lower))
            score += matches
        
        if score > 0:
            emotion_scores[emotion] = score
    
    # Return emotion with highest score, or neutral if no matches
    if emotion_scores:
        detected_emotion = max(emotion_scores, key=emotion_scores.get)
        return detected_emotion
    
    return 'neutral'


def detect_emotion_with_confidence(text: str, language: str = 'en') -> Dict[str, any]:
    """
    Detect emotion with confidence score
    
    Returns:
        {
            'emotion': str,
            'confidence': float (0.0 to 1.0),
            'scores': dict
        }
    """
    if not text:
        return {'emotion': 'neutral', 'confidence': 0.5, 'scores': {}}
    
    text_lower = text.lower()
    emotion_scores = {}
    
    # Score each emotion
    for emotion, keywords_by_lang in EMOTION_KEYWORDS.items():
        score = 0
        keywords = keywords_by_lang.get(language, []) + keywords_by_lang.get('en', [])
        
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
            matches = len(re.findall(pattern, text_lower))
            score += matches
        
        if score > 0:
            emotion_scores[emotion] = score
    
    if not emotion_scores:
        return {'emotion': 'neutral', 'confidence': 0.3, 'scores': {}}
    
    # Calculate confidence (higher if score is much higher than others)
    total_score = sum(emotion_scores.values())
    max_emotion = max(emotion_scores, key=emotion_scores.get)
    max_score = emotion_scores[max_emotion]
    
    confidence = min(0.9, max_score / max(total_score, 1) * 2)  # Scale to 0-0.9
    
    return {
        'emotion': max_emotion,
        'confidence': confidence,
        'scores': emotion_scores
    }

