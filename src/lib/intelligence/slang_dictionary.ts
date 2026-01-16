/**
 * Slang Dictionary - The Vocabulary Storehouse
 * Comprehensive database of Telugu, Hindi, Gen Z, Dating, and Meme slang
 * Used by PersonalityEngine to inject natural, varied slang into responses
 */

export const SLANG_DICTIONARY = {
  // 1. TELUGU / HYDERABAD / MASS (Native Gen Z)
  telugu: [
    // Greeting/People
    "Maccha", "Bava", "Mava", "Bammardi", "Anna", "Akka", "Babai",
    "Orey Manishi", "Bro", "Pookie", "Daridrapu Manishi", "Ni Abba",

    // Praise/Awesome
    "Adurs", "Keka", "Thopu", "Oora Mass", "Tassadeeya", "Kirrak",
    "Katharnak", "Bhale Unnavu", "Lit", "Class",

    // Insults/Negative (Use carefully in 'sarcastic' mode)
    "Bokka", "Gattar", "Chillara", "Jaffa", "Erripuk", "Cheththa Vedhava",
    "Pandi Vedhava", "Donga Vedhava", "Waste Fellow", "Pandi Kukka",
    "Kukka Vedhava", "Pandikokku Vedhava",

    // Context/Particles
    "Ra", "Da", "Le", "Ani", "Anduke", "Entira", "Avunu", "Ledhu",
    "Scene", "Local", "Lolli", "Double Meaning", "Ah Bokkale",
  ],

  // 2. DESI / HINGLISH (North Indian Influence)
  desi: [
    "Arrey", "Yaar", "Bhai", "Sunn", "Accha", "Ghanta", "Bakchodi",
    "Jugaad", "Chull", "Pataka", "Mast", "Jhakaas", "Fadu", "Funda",
    "Chapri", "Chidhana", "Dikhaava",
    "Chutiya", "Bawasir", "Bhaichood",
    "Jalwa Dikhana", "Gaayab Ho Jana", "DM Kar",
  ],

  // 3. GEN Z / GEN ALPHA / BRAINROT (Global Internet)
  genz: [
    // Acronyms (NOTE: These should be expanded in voice, not used as-is)
    "NGL", "TBH", "RN", "FR", "ONG", "IYKYK", "TFW", "FOMO", "W/L",
    "AF", "BFFR", "BBG", "CD9", "GOAT", "CEO", "NPC", "RPG", "ROTFLMAO",

    // Brainrot/Trends (AVOID "No Cap" - it's irritating, use sparingly)
    "Rizz", "Rizzler", "Drip", "Bet", "Cap", "Sus",
    "Mid", "Cooked", "Chopped", "Based", "Simp", "Stan", "Glazing",
    "Gyatt", "Skibidi", "Fanum Tax", "Ohio", "Mewing", "Looksmaxxing",
    "Mogging", "Bussin", "Pookie", "Sigma", "Menty B", "Touch Grass",
    "Let Him Cook", "Crashing Out", "Locking In", "Yap", "Yapping",
    "Delulu", "Benching", "Main Character Energy", "It's Giving",
    "Aura", "Aura Farming", "Performative", "Doomscrolling", "Moots",
    "Rage Bait", "Slaps", "Jittermaxxing", "Dayroom", "Jittleyang",
    "No Shot", "Valid", "Facts", "Fam", "Bruh", "Dank", "Woke",
    "Cray Cray", "Rad", "Bop", "Meatriding", "Ran Through", "Ratchet", "Periodt",
    "Snatched", "Glow Up", "Understood the Assignment", "Fit", "Ting", "Dead/Ded",
    "Nigga" // Use carefully and contextually, only in friendly/casual contexts
  ],

  // 4. DATING & RELATIONSHIPS
  dating: [
    "Ghosting", "Breadcrumbing", "Situationship", "Love Bombing",
    "Red Flag", "Green Flag", "The Ick", "Soft Launch", "Hard Launch",
    "Cuffed", "Ship", "OTP", "Lowkey Crushing", "Thirst Trap",
    "Talking", "Crust"
  ],

  // 5. MEMES & VIRAL
  memes: [
    "Moye Moye", "Just looking like a wow", "Chill Guy"
  ]
};

/**
 * Get random slang from a category
 * @param category - Category of slang to get
 * @param count - Number of slang terms to return
 * @returns Comma-separated string of random slang terms
 */
export const getRandomSlang = (category: keyof typeof SLANG_DICTIONARY, count: number): string => {
  const list = SLANG_DICTIONARY[category];
  if (!list || list.length === 0) return '';

  // Create a copy to avoid mutating original
  const shuffled = [...list];

  // Fisher-Yates shuffle for better randomness
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length)).join(", ");
};

