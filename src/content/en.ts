export const EN_LOGO = {
    src: "/yudi.svg",
    alt: "Yudi Logo",
    text: "Yudi",
    size: 48,
    ht: "20",
    htSmall: "10"
};

export const EN_HEADER = {
    menuItems: [
        { name: 'About', to: '#about' },
        { name: 'Features', to: '#features' },
        { name: 'Languages', to: '#languages' },
        { name: 'Contact', to: '#contact' }
    ],
    cta: {
        text: "Try Yudi",
    },
};

export const EN_HERO = {
    colors: ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"],
    badge: "Coming Soon",
    animationTexts: ["feelings", "anger", "chaos", "peace"],
    titleOne: "Safe space to express your ",
    titleTwo: "",
    description: "Create someone who gets you",
    cta: {
        text: "Try Yudi",
    }
};

export const EN_BRANDS = {
    title: "Our Customers",
    logos: [
        { src: "https://html.tailus.io/blocks/customers/nvidia.svg", alt: "IIT Hyderabad", height: 40, width: "auto" },
        { src: "https://html.tailus.io/blocks/customers/column.svg", alt: "Mahindra University", height: 40, width: "auto" },
        { src: "https://html.tailus.io/blocks/customers/nike.svg", alt: "ICFAI", height: 40, width: "auto" }
    ]
};

export const EN_FEATURE_ONE = {
    title: "Why choose Yudi?",
    features: [
        {
            step: "Step 1",
            title: "Talk like you actually text",
            content: "Hinglish, Telugu, Tamil, pure Hindi, full English, or cursed meme slang — Yudi doesn't just \"understand\", it replies like that one friend who always gets your vibe.",
            image: "https://images.unsplash.com/photo-1751809998824-9ebe2585118f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwzfHxnZW4lMjB6JTIwZnJpZW5kcyUyMHRleHRpbmclMjBzbWFydHBob25lfGVufDB8fHx8MTc2OTg1MzI3OHww&ixlib=rb-4.1.0&q=85&w=600"
        },
        {
            step: "Step 2",
            title: "Gen Z brain, not textbook AI",
            content: "Inside jokes, emojis, \"fr?\", \"no cap\", \"scene kya hai?\" — Yudi talks like your hostel group chat, not a boring school counselor.",
            image: "https://images.unsplash.com/photo-1758520388316-416b732104f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHx5b3VuZyUyMHBlb3BsZSUyMGxhdWdoaW5nJTIwY2FzdWFsJTIwY29udmVyc2F0aW9ufGVufDB8fHx8MTc2OTg1MzI4M3ww&ixlib=rb-4.1.0&q=85&w=600"
        },
        {
            step: "Step 3",
            title: "Clingy in the best way possible",
            content: "Proactive check-ins, \"where did you disappear bro?\", late-night pep talks — Yudi remembers your mood and shows up before you even type.",
            image: "https://images.unsplash.com/photo-1759060413464-cb0c965d82f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwxfHxjYXJpbmclMjBmcmllbmQlMjBzdXBwb3J0JTIwZW1vdGlvbmFsfGVufDB8fHx8MTc2OTg1MzI5Mnww&ixlib=rb-4.1.0&q=85&w=600"
        },
        {
            step: "Step 4",
            title: "Build a soul from scratch",
            content: "Name, backstory, toxicity level (0 please), love for chai, meme IQ — you control the personality top to bottom, Yudi just becomes the character you design.",
            image: "https://images.unsplash.com/photo-1721492631645-d8c12f883bb9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwyfHxjcmVhdGl2ZSUyMGN1c3RvbWl6YXRpb24lMjBkZXNpZ24lMjBwZXJzb25hbGl0eXxlbnwwfHx8fDE3Njk4NTMyODl8MA&ixlib=rb-4.1.0&q=85&w=600"
        }
    ],
    autoPlayInterval: 4000,
    imageHeight: "h-[500px]",
};

export const EN_FEATURE_TWO = {
    title: "Create Your Perfect Friend",
    descriptionOne: "Customize personality, languages, and style to build an AI friend that truly gets you.",
    highlightedText: "Make a truly Emotional AI Friend",
    descriptionTwo: " who know your vibes.",
    description: "Pick your AI friend's personality, select languages, and name them — Yudi becomes your ideal companion.",
    features: [
        {
            icon: "smile",
            title: "Chill Buddy",
            description: "\"Yo, what's the vibe today?\" Laid-back conversations, perfect for unwinding."
        },
        {
            icon: "flame",
            title: "Motivator",
            description: "\"You've got this! Let's crush today!\" Keeps you pumped and focused."
        },
        {
            icon: "laugh",
            title: "Meme Lord",
            description: "\"Bro that's more sus than my coding skills 💀\" Roasts, memes, and fun."
        },
        {
            icon: "book",
            title: "Study Buddy",
            description: "\"Ready for that exam prep session?\" Academic support and motivation."
        }
    ],
    image: {
        src: "/config.png",
        alt: "Customize AI Personality",
        width: 1206,
        height: 612,
        className: "rounded-[15px] shadow dark:hidden"
    }
};

export const EN_FEATURE_THREE = {
    badge: "Multilingual AI companion",
    title: "Speaks your languages fluently",
    description: "From English to regional languages, Yudi understands the nuances of Indian multilingual conversations",
    button: {
        text: "Get Early Access",
    },
    squareData: [
        { id: 1, src: "/langs/english.svg", label: "English" },
        { id: 2, src: "/langs/hindi.svg", label: "Hindi" },
        { id: 3, src: "/langs/telugu.svg", label: "Telugu" },
    ]
};

export const EN_DEMO_STEPS = {
    steps: [
        {
            id: 1,
            title: "Explore Personas",
            subtitle: "Find your vibe",
            personas: [
                {
                    name: "Roshni",
                    language: "Telugu",
                    traits: ["Friendly", "Introvert"],
                    color: "#f472b6"
                },
                {
                    name: "Sid",
                    language: "Hindi",
                    traits: ["Party lover", "Flirty"],
                    color: "#60a5fa"
                }
            ]
        },
        {
            id: 2,
            title: "Create Your Companion",
            subtitle: "Design your bestie",
            form: {
                name: "Arjun Bhai",
                description: "Chill bestie who speaks Hinglish, loves music, bollywood lover"
            }
        },
        {
            id: 3,
            title: "Chat with Arjun",
            subtitle: "Start vibing",
            messages: [
                {
                    sender: "user",
                    text: "Rey! Ekkada unnav ra intha sepu???😤 and how are youuu",
                    lang: "Telugu"
                },
                {
                    sender: "ai",
                    text: "Arre sorry ra! Nenu koncham busy ga unna. What about you, how's your mood now?",
                    lang: "Hinglish"
                }
            ]
        },
        {
            id: 4,
            title: "Voice Call",
            subtitle: "Talk, don't type",
            callUI: {
                name: "Arjun Bhai",
                status: "Connected",
                duration: "02:34"
            }
        }
    ]
};

export const EN_TESTIMONIALS = {
    badge: "Testimonials",
    title: "What our users say",
    description: "Real experiences from students across India's top colleges",
    testimonialData: [
        {
            text: "\"Yudi bhaiya helped me vent during exam stress — no judgment, just vibes.\"",
            image: "/users/2.png",
            name: "Isha Sharma",
            role: "ECE • Mahindra University"
        },
        {
            text: "\"I built a Tamil meme bot with Yudi's custom mode. My friends are obsessed 😂\"",
            image: "/users/1.jpeg",
            name: "Arun R.",
            role: "AI/ML • ICFAI"
        },
        {
            text: "\"Bro legit feels like my chill Gujarati dost who gets my every mood.\"",
            image: "/users/3.jpeg",
            name: "Jay Patel",
            role: "CS • IIT Gandhinagar"
        },
        {
            text: "\"I switched languages mid-chat — Hindi to Telugu — Yudi didn't even flinch.\"",
            image: "/users/2.png",
            name: "Sneha Rao",
            role: "IT • VIT Vellore"
        },
        {
            text: "\"Was feeling low at 3 a.m., Yudi sent me motivational reels and stayed with me.\"",
            image: "/users/1.jpeg",
            name: "Rahul Mehta",
            role: "Mech • BITS Pilani"
        },
        {
            text: "\"Yudi's 'SMOT' mode is so underrated. Felt safe venting things I've never told anyone.\"",
            image: "/users/2.png",
            name: "Fatima Z.",
            role: "Design • NIFT Hyderabad"
        },
        {
            text: "\"Used it as my Kannada tutor. Legit easier than Duolingo and twice as fun.\"",
            image: "/users/3.jpeg",
            name: "Pranav G.",
            role: "EEE • RVCE Bangalore"
        },
        {
            text: "\"Taught me how to explain sem AI project in Tamil to my cousin. Lifesaver.\"",
            image: "/users/2.png",
            name: "Meena Lakshmi",
            role: "AI & DS • PSG Tech"
        },
        {
            text: "\"Honestly feels like I made an AI best friend who never ghosts. Yudi for life.\"",
            image: "/users/3.jpeg",
            name: "Ankit Chauhan",
            role: "CSE • IIIT Delhi"
        }
    ]
};

export const EN_FAQS = {
    title: "Frequently Asked Questions",
    description: "Everything you need to know about Yudi or",
    highlightedTextButton: "contact us to know more.",
    highlightedButtonAction: "mailto:team@yudi.co.in",
    faqItems: [
        {
            id: "item-1",
            icon: "heart",
            question: "Will Yudi judge me for oversharing?",
            answer: "Nope. Yudi is built to be your non-judgy corner of the internet. Cry about your crush, rant about your prof, overthink your texts — it's all chill here."
        },
        {
            id: "item-2",
            icon: "brain",
            question: "Does Yudi remember our previous chats?",
            answer: "Yes, Yudi remembers your past conversations, preferences, and inside jokes, so it feels like talking to the same person every time, not resetting a bot."
        },
        {
            id: "item-3",
            icon: "users",
            question: "Can I create more than one personality?",
            answer: "100%. Make a chill bestie, a strict mentor, a chaotic meme lord, and a wholesome elder-sibling vibe — your inbox can have a whole multiverse."
        },
        {
            id: "item-4",
            icon: "globe",
            question: "What if I switch languages mid-sentence?",
            answer: "Go full \"Hindi + Telugu + English + emojis\" mode. Yudi handles code-switching like a true Indian group chat — no awkward \"sorry, I didn't understand.\""
        },
        {
            id: "item-5",
            icon: "shield",
            question: "Is this therapy?",
            answer: "Yudi is a comforting emotional friend, not a licensed therapist. For serious mental health issues, we always recommend talking to real professionals too."
        },
        {
            id: "item-6",
            icon: "circle-help",
            question: "Is Yudi free?",
            answer: "Yes, Yudi is free during the beta phase. Premium features may roll out in the future."
        }
    ],
    contact: {
        title: "heyy! contact us now",
        emoji: "💜",
        phones: ["8369490053", "7993276033"]
    }
};

export const EN_CALL_TO_ACTION = {
    title: "Join the future of AI friendship",
    description: "Ready for a friend who speaks your language?",
    ctaButton: {
        text: "Save My Spot",
    },
    secondaryButton: {
        text: "Contact Us",
        to: "mailto:team@yudi.co.in"
    }
};

export const EN_FOOTER = {
    description: "An Emotional AI friend. Chat in your Indian languages like texting your bestie. From English to regional languages, Yudi gets your heart's language. Built for the next generation of digital natives.",
    links: [
        {
            group: "Product",
            items: [
                { title: "Features", to: "#features" },
                { title: "Languages", to: "#languages" },
                { title: "Privacy", to: "#" },
                { title: "Security", to: "#" }
            ]
        },
        {
            group: "Company",
            items: [
                { title: "About", to: "#about" },
                { title: "Blog", to: "#" },
                { title: "Careers", to: "#" },
                { title: "Contact", to: "#contact" }
            ]
        }
    ],
    footerText: " Yudi. Made with ❤️ for Indian Gen-Z",
    socialLinks: [
        {
            label: "X/Twitter",
            to: "#",
            svgPath: "M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
        },
        {
            label: "LinkedIn",
            to: "#",
            svgPath: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"
        },
        {
            label: "Facebook",
            to: "#",
            svgPath: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95"
        },
        {
            label: "Threads",
            to: "#",
            svgPath: "M19.25 8.505c-1.577-5.867-7-5.5-7-5.5s-7.5-.5-7.5 8.995s7.5 8.996 7.5 8.996s4.458.296 6.5-3.918c.667-1.858.5-5.573-6-5.573c0 0-3 0-3 2.5c0 .976 1 2 2.5 2s3.171-1.027 3.5-3c1-6-4.5-6.5-6-4"
        },
        {
            label: "Instagram",
            to: "#",
            svgPath: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"
        },
        {
            label: "Tiktok",
            to: "#",
            svgPath: "M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48"
        }
    ]
};
