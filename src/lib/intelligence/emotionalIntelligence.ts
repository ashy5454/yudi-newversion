/**
 * Emotional Intelligence Engine - Chain of Thought Logic
 * Step 1: Detect Emotion → Step 2: Select Slang → Step 3: Generate Response
 */

import { SLANG_DICTIONARY } from './slang_dictionary';

export type DetectedEmotion = 'happy' | 'sad' | 'frustrated' | 'neutral' | 'excited' | 'boring' | 'boasting' | 'lying';
export type DetectedGender = 'male' | 'female' | 'neutral';
export type LanguageStyle = 'english' | 'telugu' | 'hinglish' | 'mixed';

export interface EmotionAnalysis {
  emotion: DetectedEmotion;
  confidence: number;
  gender: DetectedGender;
  topic: 'life' | 'dating' | 'random' | 'serious';
  shouldUseSarcasm: boolean;
  shouldUseInsults: boolean;
  languageStyle?: LanguageStyle;
}

export interface SlangSelection {
  primarySlang: string[];
  secondarySlang: string[];
  greetingStyle: 'excited' | 'casual' | 'empathetic';
  languageStyle: LanguageStyle;
}

// Track recently used slangs to prevent repetition (circular buffer approach)
let recentSlangs: string[] = [];
const MAX_RECENT_SLANGS = 50; // Increased to track more

/**
 * Get random slangs from a category with better rotation
 * Ensures ALL slangs get used over time, not just a few
 */
function getRandomSlangsFromCategory(
  category: keyof typeof SLANG_DICTIONARY,
  count: number,
  excludeRecent: boolean = true
): string[] {
  const allSlangs = SLANG_DICTIONARY[category] || [];
  if (allSlangs.length === 0) return [];
  
  // Filter out recently used slangs if excludeRecent is true
  let availableSlangs = excludeRecent
    ? allSlangs.filter(slang => !recentSlangs.includes(slang.toLowerCase()))
    : allSlangs;
  
  // If most/all slangs are used, reset tracking for this category to ensure rotation
  if (availableSlangs.length < Math.max(3, allSlangs.length * 0.3)) {
    // Reset recent slangs for this category only - allow reuse but prioritize unused ones
    const categoryRecent = recentSlangs.filter(s => 
      allSlangs.some(slang => slang.toLowerCase() === s)
    );
    if (categoryRecent.length >= allSlangs.length * 0.8) {
      // Most slangs used, reset tracking for this category
      recentSlangs = recentSlangs.filter(s => 
        !allSlangs.some(slang => slang.toLowerCase() === s)
      );
      availableSlangs = allSlangs;
    }
  }
  
  // Shuffle and pick from available slangs
  const shuffled = [...availableSlangs].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  // Track these slangs (lowercase for comparison)
  recentSlangs.push(...selected.map(s => s.toLowerCase()));
  if (recentSlangs.length > MAX_RECENT_SLANGS) {
    // Remove oldest slangs (FIFO approach)
    recentSlangs = recentSlangs.slice(-MAX_RECENT_SLANGS);
  }
  
  return selected;
}

/**
 * Step 1: Analyze Emotion, Gender, Topic
 */
export function analyzeEmotion(
  userText: string,
  userName?: string,
  conversationHistory?: string
): EmotionAnalysis {
  const text = userText.toLowerCase();
  const history = (conversationHistory || '').toLowerCase();

  // Emotion Detection
  let emotion: DetectedEmotion = 'neutral';
  let confidence = 0.5;

  // Happy/Excited indicators
  if (
    text.includes('happy') || text.includes('excited') || text.includes('awesome') ||
    text.includes('great') || text.includes('amazing') || text.includes('wonderful') ||
    text.includes('lit') || text.includes('fire') || text.includes('best') ||
    text.includes('love') || text.includes('❤️') || text.includes('😊') ||
    text.includes('yay') || text.includes('woohoo') || text.includes('yess')
  ) {
    emotion = 'excited';
    confidence = 0.8;
  }
  // Sad indicators
  else if (
    text.includes('sad') || text.includes('depressed') || text.includes('upset') ||
    text.includes('crying') || text.includes('hurt') || text.includes('lonely') ||
    text.includes('😢') || text.includes('😔') || text.includes('broken') ||
    text.includes('heartbroken') || text.includes('miss') || text.includes('regret')
  ) {
    emotion = 'sad';
    confidence = 0.8;
  }
  // Frustrated indicators
  else if (
    text.includes('frustrated') || text.includes('angry') || text.includes('annoyed') ||
    text.includes('irritated') || text.includes('mad') || text.includes('hate') ||
    text.includes('😠') || text.includes('🤬') || text.includes('stressed') ||
    text.includes('tired') || text.includes('exhausted')
  ) {
    emotion = 'frustrated';
    confidence = 0.8;
  }
  // Boring indicators
  else if (
    text.includes('boring') || text.includes('nothing') || text.includes('idle') ||
    text.includes('chill') || text.includes('relax') || text.includes('bored') ||
    text.length < 10 || text === 'ok' || text === 'k' || text === 'hmm'
  ) {
    emotion = 'boring';
    confidence = 0.7;
  }
  // Boasting indicators
  else if (
    text.includes('i did') || text.includes('i got') || text.includes('i won') ||
    text.includes('i have') || text.includes('i am the') || text.includes('best') ||
    text.includes('amazing') || text.includes('perfect') || text.includes('genius') ||
    text.includes('i\'m so') || text.includes('look at me') || text.includes('i can')
  ) {
    emotion = 'boasting';
    confidence = 0.7;
  }
  // Lying indicators (detect contradictions or obvious lies)
  else if (
    text.includes('i didn\'t') && history.includes('i did') ||
    text.includes('i never') && history.includes('i always') ||
    text.includes('no i') && history.includes('yes i')
  ) {
    emotion = 'lying';
    confidence = 0.6;
  }
  // Default to happy/excited if no negative indicators
  else {
    emotion = 'happy';
    confidence = 0.6;
  }

  // Gender Detection (from name or context)
  let gender: DetectedGender = 'neutral';
  if (userName) {
    const name = userName.toLowerCase();
    // Common female name patterns
    if (
      name.endsWith('a') || name.endsWith('i') || name.endsWith('ya') ||
      name.includes('priya') || name.includes('sita') || name.includes('tara') ||
      name.includes('samhita') || name.includes('divya') || name.includes('ananya') ||
      name.includes('kavya') || name.includes('riya') || name.includes('meera')
    ) {
      gender = 'female';
    }
    // Common male name patterns
    else if (
      name.endsWith('an') || name.endsWith('ar') || name.endsWith('esh') ||
      name.includes('raj') || name.includes('kumar') || name.includes('sai') ||
      name.includes('aditya') || name.includes('arjun') || name.includes('rahul')
    ) {
      gender = 'male';
    }
  }

  // Topic Detection
  let topic: 'life' | 'dating' | 'random' | 'serious' = 'random';
  if (
    text.includes('dating') || text.includes('crush') || text.includes('girlfriend') ||
    text.includes('boyfriend') || text.includes('relationship') || text.includes('breakup') ||
    text.includes('love') || text.includes('romantic') || text.includes('single')
  ) {
    topic = 'dating';
  } else if (
    text.includes('how to') || text.includes('what should') || text.includes('advice') ||
    text.includes('help me') || text.includes('guide') || text.includes('problem') ||
    text.includes('career') || text.includes('future') || text.includes('decision')
  ) {
    topic = 'serious';
  } else if (
    text.includes('college') || text.includes('parents') || text.includes('family') ||
    text.includes('friends') || text.includes('social') || text.includes('life')
  ) {
    topic = 'life';
  }

  // Language Style Detection (from user text patterns)
  let languageStyle: LanguageStyle = 'english';
  const hasTelugu = /[క-హ]/.test(text) || 
    text.includes('ra') || text.includes('da') || text.includes('le') ||
    text.includes('ante') || text.includes('enti') || text.includes('avuna') ||
    text.includes('ikkada') || text.includes('akkada') || text.includes('ledhu');
  const hasHindi = /[अ-ह]/.test(text) ||
    text.includes('hai') || text.includes('kar') || text.includes('nahi') ||
    text.includes('yaar') || text.includes('bhai') || text.includes('accha') ||
    text.includes('sahi') || text.includes('kyu') || text.includes('kya');
  
  if (hasTelugu && !hasHindi) {
    languageStyle = 'telugu';
  } else if (hasHindi && !hasTelugu) {
    languageStyle = 'hinglish';
  } else if (hasTelugu && hasHindi) {
    languageStyle = 'mixed'; // Should be avoided, but detect it
  }

  // Sarcasm/Insult Rules
  const shouldUseSarcasm = emotion === 'boasting' || emotion === 'lying' || 
    (emotion === 'boring' && topic === 'random');
  const shouldUseInsults = emotion === 'boasting' || emotion === 'lying' ||
    (history.includes('roasting') || history.includes('roast'));

  return {
    emotion,
    confidence,
    gender,
    topic,
    shouldUseSarcasm,
    shouldUseInsults,
    languageStyle
  };
}

/**
 * Step 2: Select Slang Based on Emotion, Topic, Language Style
 * Uses full dictionary with rotation to prevent repetition
 */
export function selectSlang(analysis: EmotionAnalysis): SlangSelection {
  const { emotion, gender, shouldUseSarcasm, shouldUseInsults, topic, languageStyle = 'english' } = analysis;

  let primarySlang: string[] = [];
  let secondarySlang: string[] = [];
  let greetingStyle: 'excited' | 'casual' | 'empathetic' = 'excited';
  let finalLanguageStyle: LanguageStyle = languageStyle;

  // CRITICAL: Language Separation - NO MIXING Hindi and Telugu
  // If language is detected, use ONLY that language + English
  // Never mix Hindi and Telugu together

  // Happy/Excited
  if (emotion === 'happy' || emotion === 'excited' || emotion === 'neutral') {
    greetingStyle = 'excited';
    
    if (finalLanguageStyle === 'telugu') {
      // Telugu + English ONLY - Use more slangs for better variety
      primarySlang = getRandomSlangsFromCategory('telugu', 6).concat(
        getRandomSlangsFromCategory('genz', 4)
      );
      secondarySlang = getRandomSlangsFromCategory('telugu', 4).concat(
        getRandomSlangsFromCategory('genz', 3)
      );
    } else if (finalLanguageStyle === 'hinglish') {
      // Hindi + English ONLY - Use more slangs for better variety
      primarySlang = getRandomSlangsFromCategory('desi', 6).concat(
        getRandomSlangsFromCategory('genz', 4)
      );
      secondarySlang = getRandomSlangsFromCategory('desi', 4).concat(
        getRandomSlangsFromCategory('genz', 3)
      );
    } else {
      // English/GenZ ONLY - Use more slangs for better variety
      primarySlang = getRandomSlangsFromCategory('genz', 8);
      secondarySlang = getRandomSlangsFromCategory('genz', 5);
    }
    
    // Dating-specific additions - include more dating slangs
    if (topic === 'dating') {
      const datingSlangs = getRandomSlangsFromCategory('dating', 4);
      primarySlang = primarySlang.concat(datingSlangs);
    }
  }
  // Boring → Sodhi, Pakau
  else if (emotion === 'boring') {
    greetingStyle = 'casual';
    
    if (finalLanguageStyle === 'telugu') {
      primarySlang = ['Sodhi', 'Pakau'].concat(getRandomSlangsFromCategory('telugu', 4));
      secondarySlang = getRandomSlangsFromCategory('telugu', 3);
    } else if (finalLanguageStyle === 'hinglish') {
      primarySlang = ['Pakau'].concat(getRandomSlangsFromCategory('desi', 5));
      secondarySlang = getRandomSlangsFromCategory('desi', 3);
    } else {
      primarySlang = ['Boring', 'Meh', 'Mid'].concat(getRandomSlangsFromCategory('genz', 5));
      secondarySlang = getRandomSlangsFromCategory('genz', 3);
    }
  }
  // Boasting → Dabba, Build-up
  else if (emotion === 'boasting') {
    greetingStyle = 'casual';
    
    if (finalLanguageStyle === 'telugu') {
      primarySlang = ['Dabba', 'Build-up'].concat(getRandomSlangsFromCategory('telugu', 4));
      if (shouldUseSarcasm) {
        primarySlang = primarySlang.concat(getRandomSlangsFromCategory('telugu', 2));
      }
      secondarySlang = getRandomSlangsFromCategory('telugu', 3);
    } else if (finalLanguageStyle === 'hinglish') {
      primarySlang = ['Dabba', 'Build-up'].concat(getRandomSlangsFromCategory('desi', 4));
      if (shouldUseSarcasm) {
        primarySlang = primarySlang.concat(getRandomSlangsFromCategory('desi', 2));
      }
      secondarySlang = getRandomSlangsFromCategory('desi', 3);
    } else {
      primarySlang = ['Cap', 'No Cap', 'Build-up'].concat(getRandomSlangsFromCategory('genz', 5));
      if (shouldUseSarcasm) {
        primarySlang = primarySlang.concat(getRandomSlangsFromCategory('genz', 2));
      }
      secondarySlang = getRandomSlangsFromCategory('genz', 3);
    }
  }
  // Lying → Fek mat, Cover drive
  else if (emotion === 'lying') {
    greetingStyle = 'casual';
    
    if (finalLanguageStyle === 'telugu') {
      primarySlang = ['Fek mat', 'Cover drive'].concat(getRandomSlangsFromCategory('telugu', 4));
      if (shouldUseInsults) {
        primarySlang = primarySlang.concat(getRandomSlangsFromCategory('telugu', 2));
      }
      secondarySlang = getRandomSlangsFromCategory('telugu', 3);
    } else if (finalLanguageStyle === 'hinglish') {
      primarySlang = ['Fek mat', 'Cover drive'].concat(getRandomSlangsFromCategory('desi', 4));
      if (shouldUseInsults) {
        primarySlang = primarySlang.concat(getRandomSlangsFromCategory('desi', 2));
      }
      secondarySlang = getRandomSlangsFromCategory('desi', 3);
    } else {
      primarySlang = ['Cap', 'Sus'].concat(getRandomSlangsFromCategory('genz', 5));
      if (shouldUseInsults) {
        primarySlang = primarySlang.concat(getRandomSlangsFromCategory('genz', 2));
      }
      secondarySlang = getRandomSlangsFromCategory('genz', 3);
    }
  }
  // Sad → Empathetic
  else if (emotion === 'sad') {
    greetingStyle = 'empathetic';
    
    if (finalLanguageStyle === 'telugu') {
      primarySlang = getRandomSlangsFromCategory('telugu', 5).concat(['Bro', 'Fr']);
      secondarySlang = getRandomSlangsFromCategory('telugu', 3).concat(['Valid', 'I feel you']);
    } else if (finalLanguageStyle === 'hinglish') {
      primarySlang = getRandomSlangsFromCategory('desi', 5).concat(['Bhai', 'Yaar']);
      secondarySlang = getRandomSlangsFromCategory('desi', 3).concat(['Sahi', 'Valid']);
    } else {
      primarySlang = ['Bro', 'Fr', 'NGL'].concat(getRandomSlangsFromCategory('genz', 5));
      secondarySlang = getRandomSlangsFromCategory('genz', 4).concat(['Valid', 'Facts', 'I feel you']);
    }
  }
  // Frustrated → Supportive but casual
  else if (emotion === 'frustrated') {
    greetingStyle = 'empathetic';
    
    if (finalLanguageStyle === 'telugu') {
      primarySlang = getRandomSlangsFromCategory('telugu', 5).concat(['Bro', 'Fr']);
      secondarySlang = getRandomSlangsFromCategory('telugu', 3).concat(['I feel you', 'Valid']);
    } else if (finalLanguageStyle === 'hinglish') {
      primarySlang = getRandomSlangsFromCategory('desi', 5).concat(['Bhai', 'Yaar']);
      secondarySlang = getRandomSlangsFromCategory('desi', 3).concat(['Sahi', 'Valid']);
    } else {
      primarySlang = ['Bro', 'Fr', 'NGL', 'Valid'].concat(getRandomSlangsFromCategory('genz', 5));
      secondarySlang = getRandomSlangsFromCategory('genz', 4).concat(['I feel you', 'That\'s rough', 'Dead']);
    }
  }

  // Add gender-specific slang (respect language style)
  if (gender === 'male') {
    if (finalLanguageStyle === 'telugu') {
      primarySlang.push('Machha', 'Mama', 'Bava');
    } else if (finalLanguageStyle === 'hinglish') {
      primarySlang.push('Bhai', 'Yaar');
    } else {
      primarySlang.push('Bro', 'Dude');
    }
  } else if (gender === 'female') {
    if (finalLanguageStyle === 'telugu') {
      primarySlang.push('Girl', 'Sis');
    } else if (finalLanguageStyle === 'hinglish') {
      primarySlang.push('Yaar', 'Bhai');
    } else {
      primarySlang.push('Girl', 'Sis', 'Queen');
    }
  }

  // Remove duplicates
  primarySlang = [...new Set(primarySlang)];
  secondarySlang = [...new Set(secondarySlang)];

  return {
    primarySlang,
    secondarySlang,
    greetingStyle,
    languageStyle: finalLanguageStyle
  };
}

/**
 * Generate nickname from user name
 */
export function generateNickname(userName: string, gender: DetectedGender): string {
  if (!userName) return 'bro';

  const name = userName.trim();
  if (name.length <= 3) return name;

  // Indian nickname patterns
  if (name.toLowerCase().startsWith('sai')) {
    return gender === 'male' ? 'Sai-ramm' : 'Sai';
  }
  if (name.toLowerCase().startsWith('sam')) {
    return 'Sammy';
  }
  if (name.toLowerCase().startsWith('pri')) {
    return 'Pri';
  }
  if (name.toLowerCase().startsWith('adit')) {
    return 'Adi';
  }
  if (name.toLowerCase().startsWith('arj')) {
    return 'Arj';
  }

  // Default: first 3-4 letters + suffix
  const prefix = name.substring(0, Math.min(4, name.length));
  if (gender === 'male') {
    return `${prefix}-ramm`;
  } else if (gender === 'female') {
    return `${prefix}-di`;
  }
  return prefix;
}

/**
 * Determine if spam mode should be activated
 */
export function shouldUseSpamMode(
  userMessageLength: number,
  emotion: DetectedEmotion,
  topic: 'life' | 'dating' | 'random' | 'serious'
): boolean {
  // Spam mode for short, casual messages
  if (userMessageLength < 20 && emotion !== 'sad' && emotion !== 'frustrated') {
    return true;
  }
  // Spam mode for random/casual topics
  if (topic === 'random' && emotion === 'happy') {
    return true;
  }
  return false;
}
