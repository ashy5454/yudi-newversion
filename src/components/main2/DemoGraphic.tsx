"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, Sparkles, User, ChevronRight } from "lucide-react";
import { EN_DEMO_STEPS } from "@/content/en";

const DemoGraphic = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = EN_DEMO_STEPS.steps;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [steps.length]);

    const renderStepContent = (step: typeof steps[0]) => {
        switch (step.id) {
            case 1:
                return (
                    <motion.div 
                        className="space-y-4"
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
                                className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
                            >
                                <div 
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
                                    style={{ backgroundColor: persona.color }}
                                >
                                    {persona.name[0]}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold text-lg">{persona.name}</h4>
                                    <p className="text-white/60 text-sm">{persona.language}</p>
                                    <div className="flex gap-2 mt-1">
                                        {persona.traits.map((trait) => (
                                            <span key={trait} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/80">
                                                {trait}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"
                                    >
                                        <Phone className="w-5 h-5 text-green-400" />
                                    </motion.button>
                                    <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"
                                    >
                                        <MessageCircle className="w-5 h-5 text-purple-400" />
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
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-white/60 text-sm mb-2 block">Name your companion</label>
                                    <motion.div 
                                        className="bg-white/10 rounded-xl px-4 py-3 text-white font-semibold text-lg"
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 0.8, delay: 0.3 }}
                                    >
                                        {step.form?.name}
                                    </motion.div>
                                </div>
                                <div>
                                    <label className="text-white/60 text-sm mb-2 block">Describe their personality</label>
                                    <motion.div 
                                        className="bg-white/10 rounded-xl px-4 py-3 text-white/80 text-sm leading-relaxed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5, delay: 0.6 }}
                                    >
                                        {step.form?.description}
                                    </motion.div>
                                </div>
                                <motion.button
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.9 }}
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Generate with AI
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                );
            
            case 3:
                return (
                    <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            {step.messages?.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.5 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
                                >
                                    <div 
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                                            msg.sender === 'user' 
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md' 
                                                : 'bg-white/10 text-white rounded-bl-md'
                                        }`}
                                    >
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                        <span className="text-xs opacity-60 mt-1 block">{msg.lang}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );
            
            case 4:
                return (
                    <motion.div 
                        className="flex flex-col items-center justify-center py-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="relative">
                            <motion.div
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white"
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
                                className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <Phone className="w-4 h-4 text-white" />
                            </motion.div>
                        </div>
                        <h4 className="text-white font-bold text-xl mt-4">{step.callUI?.name}</h4>
                        <p className="text-green-400 text-sm mt-1">{step.callUI?.status}</p>
                        <motion.div
                            className="flex items-center gap-2 mt-3 bg-white/10 px-4 py-2 rounded-full"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white/80 font-mono">{step.callUI?.duration}</span>
                        </motion.div>
                    </motion.div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Phone Frame */}
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />
                
                {/* Screen */}
                <div className="bg-[#0B0F19] rounded-[2.5rem] overflow-hidden min-h-[480px]">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-8 pt-3 pb-2">
                        <span className="text-white/60 text-xs font-medium">9:41</span>
                        <div className="flex gap-1">
                            <div className="w-4 h-2 bg-white/60 rounded-sm" />
                            <div className="w-4 h-2 bg-white/60 rounded-sm" />
                            <div className="w-6 h-3 bg-green-500 rounded-sm" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-4 pb-6">
                        {/* Step Header */}
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-4"
                        >
                            <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
                                Step {steps[currentStep].id}
                            </span>
                            <h3 className="text-white text-xl font-bold mt-1">
                                {steps[currentStep].title}
                            </h3>
                            <p className="text-white/50 text-sm">
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
            <div className="flex justify-center gap-2 mt-6">
                {steps.map((_, idx) => (
                    <motion.button
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            idx === currentStep 
                                ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500' 
                                : 'w-2 bg-white/20 hover:bg-white/40'
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
