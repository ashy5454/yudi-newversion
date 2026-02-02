"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, Sparkles } from "lucide-react";
import { EN_DEMO_STEPS } from "@/content/en";

const DemoGraphic = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [currentConversation, setCurrentConversation] = useState(0);
    const steps = EN_DEMO_STEPS.steps;
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [steps.length]);

    // Auto-scroll chat messages and switch conversations
    useEffect(() => {
        if (currentStep === 2 && scrollRef.current) {
            const scrollContainer = scrollRef.current;
            let scrollPos = 0;
            const scrollSpeed = 0.5;
            
            const scrollInterval = setInterval(() => {
                scrollPos += scrollSpeed;
                scrollContainer.scrollLeft = scrollPos;
                
                // Reset and switch conversation when reaching end
                if (scrollPos >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
                    scrollPos = 0;
                    scrollContainer.scrollLeft = 0;
                    const chatConvos = steps[2].chatConversations;
                    if (chatConvos) {
                        setCurrentConversation((prev) => (prev + 1) % chatConvos.length);
                    }
                }
            }, 30);
            
            return () => clearInterval(scrollInterval);
        }
    }, [currentStep, currentConversation, steps]);

    const renderStepContent = (step: typeof steps[0]) => {
        switch (step.id) {
            case 1:
                return (
                    <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {step.personas?.map((persona, idx) => (
                            <motion.div
                                key={persona.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.2 }}
                                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10"
                            >
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                                    style={{ backgroundColor: persona.color }}
                                >
                                    {persona.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold text-base">{persona.name}</h4>
                                    <p className="text-white/60 text-xs">{persona.language}</p>
                                    <div className="flex gap-1.5 mt-1">
                                        {persona.traits.map((trait) => (
                                            <span key={trait} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/80">
                                                {trait}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center"
                                    >
                                        <Phone className="w-4 h-4 text-green-400" />
                                    </motion.button>
                                    <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center"
                                    >
                                        <MessageCircle className="w-4 h-4 text-purple-400" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                );
            
            case 2:
                return (
                    <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-white/60 text-xs mb-1.5 block">Name your companion</label>
                                    <motion.div 
                                        className="bg-white/10 rounded-xl px-3 py-2.5 text-white font-semibold text-base"
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 0.8, delay: 0.3 }}
                                    >
                                        {step.form?.name}
                                    </motion.div>
                                </div>
                                <div>
                                    <label className="text-white/60 text-xs mb-1.5 block">Describe their personality</label>
                                    <motion.div 
                                        className="bg-white/10 rounded-xl px-3 py-2.5 text-white/80 text-sm leading-relaxed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5, delay: 0.6 }}
                                    >
                                        {step.form?.description}
                                    </motion.div>
                                </div>
                                <motion.button
                                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 text-sm"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.9 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Generate with AI
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                );
            
            case 3:
                const chatConvos = step.chatConversations;
                if (!chatConvos) return null;
                const currentChat = chatConvos[currentConversation];
                
                return (
                    <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Companion Name Badge */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                {currentChat.companion[0]}
                            </div>
                            <span className="text-white/80 text-sm font-medium">
                                Chat with {currentChat.companion}
                            </span>
                        </div>
                        
                        {/* Horizontal Scrolling Chat */}
                        <div 
                            ref={scrollRef}
                            className="overflow-x-auto scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                                {currentChat.messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`flex-shrink-0 max-w-[220px] px-3 py-2.5 rounded-2xl ${
                                            msg.sender === 'user' 
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                                                : 'bg-white/10 text-white'
                                        }`}
                                    >
                                        <p className="text-xs leading-relaxed">{msg.text}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Conversation Indicator */}
                        <div className="flex justify-center gap-2 mt-2">
                            {chatConvos.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                        idx === currentConversation 
                                            ? 'bg-purple-500 scale-125' 
                                            : 'bg-white/30'
                                    }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                );
            
            case 4:
                return (
                    <motion.div 
                        className="flex flex-col items-center justify-center py-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="relative">
                            <motion.div
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white"
                                animate={{ 
                                    boxShadow: [
                                        "0 0 0 0 rgba(168, 85, 247, 0.4)",
                                        "0 0 0 20px rgba(168, 85, 247, 0)",
                                    ]
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                A
                            </motion.div>
                            <motion.div
                                className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <Phone className="w-3.5 h-3.5 text-white" />
                            </motion.div>
                        </div>
                        <h4 className="text-white font-bold text-lg mt-3">{step.callUI?.name}</h4>
                        <p className="text-green-400 text-sm mt-1">{step.callUI?.status}</p>
                        <motion.div
                            className="flex items-center gap-2 mt-2 bg-white/10 px-3 py-1.5 rounded-full"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white/80 font-mono text-sm">{step.callUI?.duration}</span>
                        </motion.div>
                    </motion.div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            {/* Phone Frame */}
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-10" />
                
                {/* Screen */}
                <div className="bg-[#0B0F19] rounded-[2rem] overflow-hidden min-h-[420px]">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-6 pt-2 pb-1">
                        <span className="text-white/60 text-xs font-medium">9:41</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-1.5 bg-white/60 rounded-sm" />
                            <div className="w-3 h-1.5 bg-white/60 rounded-sm" />
                            <div className="w-5 h-2.5 bg-green-500 rounded-sm" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-3 pb-4">
                        {/* Step Header */}
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-3"
                        >
                            <span className="text-purple-400 text-[10px] font-semibold uppercase tracking-wider">
                                Step {steps[currentStep].id}
                            </span>
                            <h3 className="text-white text-lg font-bold mt-0.5">
                                {steps[currentStep].title}
                            </h3>
                            <p className="text-white/50 text-xs">
                                {steps[currentStep].subtitle}
                            </p>
                        </motion.div>

                        {/* Step Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderStepContent(steps[currentStep])}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-4">
                {steps.map((_, idx) => (
                    <motion.button
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentStep 
                                ? 'w-6 bg-gradient-to-r from-purple-500 to-pink-500' 
                                : 'w-1.5 bg-white/20 hover:bg-white/40'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                    />
                ))}
            </div>
        </div>
    );
};

export default DemoGraphic;
