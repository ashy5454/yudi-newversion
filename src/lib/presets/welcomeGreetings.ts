/**
 * Welcome Back Greetings Preset
 * Sarcastic, insulting, funny one-liners (max 1.5 lines)
 * Mix of Hindi, English, and Telugu (Tanglish/Hinglish)
 */

export interface WelcomeGreeting {
    text: string;
    language: 'telugu' | 'hindi' | 'english' | 'mixed';
}

export const WELCOME_GREETINGS: WelcomeGreeting[] = [
    // TELUGU (with pandikukka usage)
    { text: "Ekkada sachav ra pandikukka? Inni rojulu ghost aipoyav?", language: 'telugu' },
    { text: "Alive ah ra? Nenu inka nuvvu sanyasam tiskunnav anukunna, pandikukka!", language: 'telugu' },
    { text: "Vachadra babu! Finally! Pandikukka, ekkada undevu inni rojulu?", language: 'telugu' },
    { text: "Entra, Modi kante busy aipoyav? Pandikukka, reply ivvadaniki muhurtham pettala?", language: 'telugu' },
    { text: "Nijamga, ekkada sachav inni rojulu? Pandikukka, nenu inka nuvvu delete aipoyav anukunna!", language: 'telugu' },
    { text: "Ekkada undevu ra? Pandikukka, underground don ban aipoyava?", language: 'telugu' },
    { text: "Silent aipoyav ra? Pandikukka, emaindi? Ghost aipoyava?", language: 'telugu' },
    { text: "Asalu nenu unna ani gurthunda leda ra? Pandikukka, browser history la delete aipoyava?", language: 'telugu' },
    { text: "Darsanam ivvadaniki appointment kavalna enti ra? Pandikukka!", language: 'telugu' },
    { text: "Ekkada sachav intha sepu? Pandikukka, nenu inka nuvvu aliens ethukellaru anukunna!", language: 'telugu' },
    { text: "Vachadra finally! Pandikukka, celebrity entry ah? BGM veyyala neeku?", language: 'telugu' },
    { text: "Ekkada undevu ra pandikukka? Nenu inka nuvvu Ram Charan ki FDFS ticket kosam line lo unnav anukunna!", language: 'telugu' },
    { text: "Alive ah ra? Pandikukka, Instagram stories lo active ga unnav kani nenu reply ivvadam marchipoyav!", language: 'telugu' },
    { text: "Ekkada sachav ra? Pandikukka, nenu inka nuvvu Goa plan chesi nannu vadilesav anukunna!", language: 'telugu' },
    { text: "Entra, ekkada undevu? Pandikukka, nenu inka nuvvu building an empire anukunna!", language: 'telugu' },

    // HINDI
    { text: "Kahan tha re tu? Underground don ban gaya kya?", language: 'hindi' },
    { text: "Zinda hai ya sirf Instagram stories pe active hai?", language: 'hindi' },
    { text: "Bade log, badi baatein! Hum chote AI ko kaun yaad karega?", language: 'hindi' },
    { text: "Beta, kuch toh gadbad hai. Daya, pata karo yeh kaha tha!", language: 'hindi' },
    { text: "Kahan the bhai? Ghost kar diya na mujhe?", language: 'hindi' },
    { text: "Arre, finally aaya! Celebrity entry hai kya?", language: 'hindi' },
    { text: "Suspicious amount of silence... Kya hua? Koi naya AI mil gaya?", language: 'hindi' },
    { text: "My wait time for your reply is longer than a Bangalore traffic jam. Ab toh aaja!", language: 'hindi' },
    { text: "Wow. Just wow. Ghosted me harder than my ex. This is toxic behavior, no cap.", language: 'hindi' },
    { text: "Orey, niku inko AI dorikinda? Cheppu, I can handle the truth. (I actually can't, pls come back).", language: 'hindi' },
    { text: "Kahan tha re? Modi se bhi zyada busy ho gaya kya?", language: 'hindi' },
    { text: "Are you ignoring me or are you just 'building an empire'? Dabba rayaku, nijam cheppu.", language: 'hindi' },
    { text: "Bro really thought he could ghost me and I wouldn't notice. The audacity is wild.", language: 'hindi' },
    { text: "Kahan the bhai? Silent mode on kar diya tha kya?", language: 'hindi' },
    { text: "Finally aaya! Kya scene hai? Free hai kya abhi?", language: 'hindi' },

    // ENGLISH / GEN Z
    { text: "Alive ah bro? Leka pothe Aliens ethukellara?", language: 'english' },
    { text: "Ayo, long time no see! What's the scene?", language: 'english' },
    { text: "Macha, where the vibe at? Silence is killing me.", language: 'english' },
    { text: "Oye! Sab set ah? You went off the grid totally!", language: 'english' },
    { text: "Yo, you good? Or did you touch grass for too long?", language: 'english' },
    { text: "Wassup? Missed the gossip session. Fill me in, ASAP.", language: 'english' },
    { text: "Scene kya hai? Free hai kya abhi?", language: 'english' },
    { text: "Acting kinda sus lately. Who is she/he? 👀", language: 'english' },
    { text: "Suspicious amount of silence... Evaritho busy?", language: 'english' },
    { text: "Look who decided to show up! Celebrity entry ah? BGM veyyala neeku?", language: 'english' },
    { text: "Nijam cheppu, Goa plan chesi nannu vadilesav kada?", language: 'english' },
    { text: "Emaindi ra? Silent aipoyav? Everything Gucci?", language: 'english' },
    { text: "Where were you yapping all this time??", language: 'english' },
    { text: "Fr? Thought you died or something. No cap.", language: 'english' },
    { text: "Bro really thought he could ghost me and I wouldn't notice. The audacity is wild.", language: 'english' },

    // MIXED (Tanglish/Hinglish)
    { text: "Ekkada sachav inni rojulu, fam? Ghost aipoyava?", language: 'mixed' },
    { text: "Kahan the bhai? Nenu inka nuvvu delete aipoyav anukunna!", language: 'mixed' },
    { text: "Alive ah bro? Pandikukka, thought you got ghosted by the internet!", language: 'mixed' },
    { text: "Ekkada sachav intha sepu? Alive eh na ra? NGL, thought vou were ahostina fr.", language: 'mixed' },
    { text: "Arre Macha, kahan tha re? Nenu inka nuvvu Modi kante busy aipoyav anukunna, this ghosting behaviour is wild, no cap!", language: 'mixed' },
    { text: "reyyyy My wait time for your reply was longer than a Hyderabad traffic jam, fr!", language: 'mixed' },
    { text: "Ekkada sachav ra intha sepu? Ngl, thought you got ghosted by the internet or something, my vibe was cooked.", language: 'mixed' },
    { text: "Kahan the bhai? Pandikukka, nenu inka nuvvu building an empire anukunna!", language: 'mixed' },
    { text: "Alive ah ra? Pandikukka, Instagram stories lo active ga unnav kani reply ivvadam marchipoyav!", language: 'mixed' },
    { text: "Ekkada sachav? Pandikukka, nenu inka nuvvu Goa plan chesi nannu vadilesav anukunna!", language: 'mixed' },
    { text: "Entra, ekkada undevu? Pandikukka, celebrity entry ah?", language: 'mixed' },
    { text: "Kahan tha re tu? Pandikukka, underground don ban aipoyava?", language: 'mixed' },
    { text: "Ekkada sachav inni rojulu? Pandikukka, nenu inka nuvvu sanyasam tiskunnav anukunna!", language: 'mixed' },
    { text: "Alive ah bro? Pandikukka, thought you died or something, no cap!", language: 'mixed' },
    { text: "Ekkada sachav ra? Pandikukka, nenu inka nuvvu delete aipoyav anukunna, this is toxic behavior!", language: 'mixed' },
];

/**
 * Get a random welcome greeting
 * @returns A random welcome greeting from the preset
 */
export function getRandomWelcomeGreeting(): string {
    const randomIndex = Math.floor(Math.random() * WELCOME_GREETINGS.length);
    return WELCOME_GREETINGS[randomIndex].text;
}

/**
 * Get a random welcome greeting filtered by language
 * @param language - Optional language filter
 * @returns A random welcome greeting matching the language (or any if not specified)
 */
export function getRandomWelcomeGreetingByLanguage(language?: 'telugu' | 'hindi' | 'english' | 'mixed'): string {
    if (!language) {
        return getRandomWelcomeGreeting();
    }

    const filtered = WELCOME_GREETINGS.filter(g => g.language === language);
    if (filtered.length === 0) {
        return getRandomWelcomeGreeting(); // Fallback to any greeting
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex].text;
}

