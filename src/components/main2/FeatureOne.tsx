"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { EN_FEATURE_ONE } from "@/content/en";
import AnimatedBackground from "./AnimatedBackground";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Feature {
    step: string;
    title?: string;
    content: string;
    image: string;
}

export default function FeatureOne() {
    const [currentFeature, setCurrentFeature] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const features = EN_FEATURE_ONE.features;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAutoPlaying) return;
        
        const timer = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % features.length);
        }, EN_FEATURE_ONE.autoPlayInterval);

        return () => clearInterval(timer);
    }, [features.length, isAutoPlaying]);

    const goToSlide = (index: number) => {
        setCurrentFeature(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 8000);
    };

    const nextSlide = () => {
        goToSlide((currentFeature + 1) % features.length);
    };

    const prevSlide = () => {
        goToSlide((currentFeature - 1 + features.length) % features.length);
    };

    return (
        <div className="relative w-full min-h-screen flex items-center overflow-hidden">
            <AnimatedBackground />
            
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-16">
                {/* Section Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
                        style={{ fontFamily: "'Clash Display', 'Outfit', sans-serif" }}
                    >
                        {EN_FEATURE_ONE.title}
                    </h2>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        no cap, Yudi hits different fr fr 💯
                    </p>
                </motion.div>

                {/* Horizontal Carousel */}
                <div 
                    ref={containerRef}
                    className="relative"
                >
                    {/* Navigation Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20 -translate-x-2 md:translate-x-0"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20 translate-x-2 md:translate-x-0"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Carousel Content */}
                    <div className="overflow-hidden mx-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentFeature}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
                            >
                                {/* Text Content */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="order-2 lg:order-1"
                                >
                                    {/* Feature Number Badge */}
                                    <div className="inline-flex items-center gap-2 mb-4">
                                        <span className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                            {currentFeature + 1}
                                        </span>
                                        <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">
                                            Feature
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 
                                        className="text-3xl md:text-4xl font-bold text-white mb-4"
                                        style={{ fontFamily: "'Clash Display', 'Outfit', sans-serif" }}
                                    >
                                        {features[currentFeature].title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-white/70 text-lg leading-relaxed">
                                        {features[currentFeature].content}
                                    </p>

                                    {/* Progress Indicators */}
                                    <div className="flex gap-2 mt-8">
                                        {features.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => goToSlide(idx)}
                                                className="relative h-1.5 rounded-full overflow-hidden bg-white/20 transition-all"
                                                style={{ width: idx === currentFeature ? '3rem' : '1.5rem' }}
                                            >
                                                {idx === currentFeature && (
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500"
                                                        initial={{ scaleX: 0 }}
                                                        animate={{ scaleX: 1 }}
                                                        transition={{ duration: EN_FEATURE_ONE.autoPlayInterval / 1000, ease: "linear" }}
                                                        style={{ transformOrigin: "left" }}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Image */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="order-1 lg:order-2 flex justify-center"
                                >
                                    <div className="relative w-full max-w-md aspect-square">
                                        {/* Glow Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-3xl blur-3xl" />
                                        
                                        {/* Image Container */}
                                        <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
                                            <img
                                                src={features[currentFeature].image}
                                                alt={features[currentFeature].title}
                                                className="w-full h-full object-cover"
                                            />
                                            
                                            {/* Overlay Gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/80 via-transparent to-transparent" />
                                            
                                            {/* Feature Label */}
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
                                                    <span className="text-white/80 text-sm font-medium">
                                                        ✨ {features[currentFeature].title}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Mobile Dots */}
                <div className="flex justify-center gap-3 mt-8 lg:hidden">
                    {features.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={cn(
                                "w-3 h-3 rounded-full transition-all",
                                idx === currentFeature 
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 scale-125" 
                                    : "bg-white/30 hover:bg-white/50"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
