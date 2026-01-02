"""
TTS Cache - Cache common TTS responses for instant playback
Speeds up frequently used phrases from ~4 seconds to instant
"""

import hashlib
import threading
from typing import Optional, Tuple, Dict
from collections import OrderedDict


class TTSCache:
    """
    LRU Cache for TTS audio responses
    Caches common responses for instant playback
    """
    
    def __init__(self, max_size: int = 1000):
        """
        Initialize TTS Cache
        
        Args:
            max_size: Maximum number of cached entries (LRU eviction after this)
        """
        self.max_size = max_size
        self.cache: OrderedDict[str, Tuple[bytes, int]] = OrderedDict()
        self.lock = threading.Lock()
        self.hits = 0
        self.misses = 0
    
    def _make_key(self, text: str, language: str, speaker: str = 'female') -> str:
        """
        Create cache key from text, language, and speaker
        
        Args:
            text: Text to synthesize
            language: Language code ('hi', 'te', 'en')
            speaker: Speaker type ('male', 'female')
            
        Returns:
            Cache key string
        """
        # Normalize text (strip whitespace, lowercase for consistency)
        normalized_text = text.strip().lower()
        
        # Create hash for faster lookup
        key_string = f"{normalized_text}_{language}_{speaker}"
        return hashlib.md5(key_string.encode('utf-8')).hexdigest()
    
    def get(self, text: str, language: str, speaker: str = 'female') -> Optional[Tuple[bytes, int]]:
        """
        Get cached audio for text/language/speaker
        
        Args:
            text: Text to synthesize
            language: Language code ('hi', 'te', 'en')
            speaker: Speaker type ('male', 'female')
            
        Returns:
            Tuple of (audio_bytes, sample_rate) if cached, None otherwise
        """
        with self.lock:
            key = self._make_key(text, language, speaker)
            
            if key in self.cache:
                # Move to end (most recently used)
                audio_data = self.cache.pop(key)
                self.cache[key] = audio_data
                self.hits += 1
                return audio_data
            else:
                self.misses += 1
                return None
    
    def set(self, text: str, language: str, audio_bytes: bytes, sample_rate: int, speaker: str = 'female') -> None:
        """
        Cache audio for text/language/speaker
        
        Args:
            text: Text that was synthesized
            language: Language code ('hi', 'te', 'en')
            audio_bytes: Generated audio bytes
            sample_rate: Audio sample rate
            speaker: Speaker type ('male', 'female')
        """
        with self.lock:
            key = self._make_key(text, language, speaker)
            
            # If key exists, remove it (will re-add at end)
            if key in self.cache:
                self.cache.pop(key)
            
            # Add new entry at end
            self.cache[key] = (audio_bytes, sample_rate)
            
            # LRU eviction: remove oldest if cache is full
            if len(self.cache) > self.max_size:
                self.cache.popitem(last=False)  # Remove oldest (first) item
    
    def clear(self) -> None:
        """Clear all cached entries"""
        with self.lock:
            self.cache.clear()
            self.hits = 0
            self.misses = 0
    
    def get_stats(self) -> Dict:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache stats
        """
        with self.lock:
            total = self.hits + self.misses
            hit_rate = (self.hits / total * 100) if total > 0 else 0.0
            
            return {
                'size': len(self.cache),
                'max_size': self.max_size,
                'hits': self.hits,
                'misses': self.misses,
                'hit_rate': f"{hit_rate:.1f}%"
            }
    
    def preload_common_responses(self, tts_engine) -> None:
        """
        Pre-cache common responses for instant playback
        
        Args:
            tts_engine: IndicTTSEngine instance to generate audio
        """
        print("Pre-loading common TTS responses into cache...")
        
        # Common responses in English
        common_english = [
            "Hi, I'm Yudi",
            "I hear you",
            "That sounds tough",
            "I'm here for you",
            "How are you feeling?",
            "Tell me more about that",
            "I understand",
            "You're not alone",
            "That must be difficult",
            "I'm listening"
        ]
        
        # Common responses in Hindi
        common_hindi = [
            "नमस्ते, मैं यूदी हूं",
            "मैं आपकी बात सुन रहा हूं",
            "यह कठिन लग रहा है",
            "मैं यहां आपके लिए हूं",
            "आप कैसा महसूस कर रहे हैं?",
            "मुझे इसके बारे में और बताएं",
            "मैं समझ गया",
            "आप अकेले नहीं हैं",
            "यह मुश्किल होगा",
            "मैं सुन रहा हूं"
        ]
        
        # Common responses in Telugu
        common_telugu = [
            "నమస్కారం, నేను యుడీ",
            "నేను మీ మాట వింటున్నాను",
            "అది కష్టంగా ఉండవచ్చు",
            "నేను మీ కోసం ఇక్కడ ఉన్నాను",
            "మీరు ఎలా భావిస్తున్నారు?",
            "దాని గురించి నాకు మరింత చెప్పండి",
            "నాకు అర్థమైంది",
            "మీరు ఒంటరిగా లేరు",
            "అది కష్టంగా ఉంటుంది",
            "నేను వింటున్నాను"
        ]
        
        # Crisis support templates
        crisis_responses = [
            "You're safe here. Let's talk about what's on your mind.",
            "I'm here to support you. What do you need right now?",
            "It's okay to not be okay. I'm here to listen."
        ]
        
        # Combine all responses
        responses_to_cache = []
        
        for text in common_english + crisis_responses:
            responses_to_cache.append((text, 'en', 'female'))
        
        for text in common_hindi:
            responses_to_cache.append((text, 'hi', 'female'))
        
        for text in common_telugu:
            responses_to_cache.append((text, 'te', 'female'))
        
        # Generate and cache
        cached_count = 0
        failed_count = 0
        
        for text, language, speaker in responses_to_cache:
            try:
                # Generate audio
                audio_bytes, sample_rate = tts_engine.synthesize(
                    text=text,
                    language=language,
                    speaker=speaker
                )
                
                # Cache it
                self.set(text, language, audio_bytes, sample_rate, speaker)
                cached_count += 1
                
            except Exception as e:
                print(f"  ⚠️  Failed to cache '{text[:30]}...' ({language}): {str(e)}")
                failed_count += 1
        
        print(f"✅ Pre-cached {cached_count} common responses ({failed_count} failed)")
        print(f"   Cache stats: {self.get_stats()}")


# Global cache instance
_global_cache: Optional[TTSCache] = None


def get_cache(max_size: int = 1000) -> TTSCache:
    """
    Get or create global TTS cache instance
    
    Args:
        max_size: Maximum cache size (only used on first call)
        
    Returns:
        Global TTSCache instance
    """
    global _global_cache
    if _global_cache is None:
        _global_cache = TTSCache(max_size=max_size)
    return _global_cache


def clear_cache() -> None:
    """Clear the global cache"""
    global _global_cache
    if _global_cache is not None:
        _global_cache.clear()


def get_cache_stats() -> Dict:
    """Get statistics from the global cache"""
    global _global_cache
    if _global_cache is None:
        return {'status': 'cache_not_initialized'}
    return _global_cache.get_stats()

