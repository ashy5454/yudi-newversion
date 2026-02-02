"use client";

import { useEffect, type MouseEventHandler } from "react";
import {
    useMotionTemplate,
    useMotionValue,
    motion,
    animate,
} from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { EN_HERO } from "@/content/en";
import { FlipWords } from "@/magicui/flip-words";
import AnimatedBackground from "./AnimatedBackground";
import DemoGraphic from "./DemoGraphic";

const Hero = ({ handleEarlyAccess }: { handleEarlyAccess?: MouseEventHandler<HTMLButtonElement> }) => {
    const color = useMotionValue(EN_HERO.colors[0]);

    useEffect(() => {
        animate(color, EN_HERO.colors, {
            ease: "easeInOut",
            duration: 10,
            repeat: Infinity,
            repeatType: "mirror",
        });
    }, [color]);

    const border = useMotionTemplate`1px solid ${color}`;
    const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

    return (
        <motion.section className="relative min-h-screen overflow-hidden w-full pt-20">
            <AnimatedBackground showGradient={true} />
            
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh]">
                    {/* Left Side - Text Content */}
                    <motion.div 
                        className="flex flex-col items-center lg:items-start text-center lg:text-left"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Main Heading */}
                        <h1 
                            className="font-bold leading-tight mb-6" 
                            style={{ 
                                fontFamily: "'Clash Display', 'Outfit', sans-serif", 
                                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                                lineHeight: 1.1
                            }}
                        >
                            <span className="text-white">{EN_HERO.titleOne}</span>
                            <span className="inline-block">
                                <FlipWords 
                                    className="px-2 inline relative bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent" 
                                    words={EN_HERO.animationTexts} 
                                    duration={2000}
                                />
                            </span>
                            <br />
                            <span className="text-white">{EN_HERO.titleTwo}</span>
                        </h1>

                        {/* Description */}
                        <motion.p 
                            className="text-white/70 text-lg md:text-xl mb-8 max-w-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            {EN_HERO.description}
                        </motion.p>

                        {/* CTA Button */}
                        <motion.button
                            style={{
                                border,
                                boxShadow,
                            }}
                            whileHover={{
                                scale: 1.05,
                            }}
                            whileTap={{
                                scale: 0.95,
                            }}
                            onClick={handleEarlyAccess}
                            className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-8 py-4 text-lg font-semibold text-white transition-all hover:from-purple-600/30 hover:to-pink-600/30"
                        >
                            <span>{EN_HERO.cta.text}</span>
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-rotate-45" />
                        </motion.button>

                        {/* Trust Badges */}
                        <motion.div
                            className="flex items-center gap-4 mt-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="flex -space-x-2">
                                {['/users/1.jpeg', '/users/2.png', '/users/3.jpeg'].map((src, i) => (
                                    <img
                                        key={i}
                                        src={src}
                                        alt="User"
                                        className="w-8 h-8 rounded-full border-2 border-[#0B0F19] object-cover"
                                    />
                                ))}
                            </div>
                            <span className="text-white/60 text-sm">
                                <span className="text-white font-semibold">1000+</span> Gen-Z already vibing
                            </span>
                        </motion.div>
                    </motion.div>

                    {/* Right Side - Demo Graphic */}
                    <motion.div 
                        className="hidden md:flex items-center justify-center"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <DemoGraphic />
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
};

export default Hero;
