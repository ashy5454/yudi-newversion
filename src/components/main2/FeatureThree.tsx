"use client";

import { motion } from "framer-motion";
import React, { useEffect, useRef, useState, type MouseEventHandler } from "react";
import { EN_FEATURE_THREE } from "@/content/en";
import AnimatedBackground from "./AnimatedBackground";

const Language3DBlock = ({ 
    src, 
    label, 
    delay = 0,
    position 
}: { 
    src: string; 
    label: string; 
    delay?: number;
    position: { x: number; y: number; z: number };
}) => {
    return (
        <motion.div
            className="absolute"
            initial={{ 
                opacity: 0, 
                scale: 0,
                rotateX: -90,
                rotateY: 45,
            }}
            animate={{ 
                opacity: 1, 
                scale: 1,
                rotateX: [0, 10, 0, -10, 0],
                rotateY: [0, 15, 0, -15, 0],
                y: [0, -15, 0, 15, 0],
            }}
            transition={{
                opacity: { duration: 0.5, delay },
                scale: { duration: 0.5, delay },
                rotateX: { duration: 8, repeat: Infinity, ease: "easeInOut", delay },
                rotateY: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay },
            }}
            style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
        >
            {/* 3D Cube Container */}
            <motion.div
                className="relative w-32 h-32 md:w-40 md:h-40"
                style={{
                    transformStyle: "preserve-3d",
                }}
                whileHover={{
                    scale: 1.1,
                    rotateY: 180,
                }}
                transition={{ duration: 0.6 }}
            >
                {/* Front Face */}
                <div 
                    className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl"
                    style={{
                        transform: "translateZ(20px)",
                        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <img 
                        src={src} 
                        alt={label}
                        className="w-full h-full object-contain p-4"
                    />
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                        <span className="text-white/90 text-sm font-bold bg-black/30 px-3 py-1 rounded-full">
                            {label}
                        </span>
                    </div>
                </div>

                {/* Back Face */}
                <div 
                    className="absolute inset-0 rounded-2xl border-2 border-white/10"
                    style={{
                        transform: "translateZ(-20px) rotateY(180deg)",
                        background: "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2))",
                    }}
                />

                {/* Left Face */}
                <div 
                    className="absolute top-0 left-0 w-10 h-full rounded-l-xl"
                    style={{
                        transform: "rotateY(-90deg) translateZ(5px)",
                        background: "linear-gradient(180deg, rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.4))",
                    }}
                />

                {/* Right Face */}
                <div 
                    className="absolute top-0 right-0 w-10 h-full rounded-r-xl"
                    style={{
                        transform: "rotateY(90deg) translateZ(125px)",
                        background: "linear-gradient(180deg, rgba(236, 72, 153, 0.4), rgba(139, 92, 246, 0.4))",
                    }}
                />

                {/* Top Face */}
                <div 
                    className="absolute top-0 left-0 w-full h-10 rounded-t-xl"
                    style={{
                        transform: "rotateX(90deg) translateZ(5px)",
                        background: "linear-gradient(90deg, rgba(139, 92, 246, 0.5), rgba(236, 72, 153, 0.5))",
                    }}
                />

                {/* Bottom Face */}
                <div 
                    className="absolute bottom-0 left-0 w-full h-10 rounded-b-xl"
                    style={{
                        transform: "rotateX(-90deg) translateZ(125px)",
                        background: "linear-gradient(90deg, rgba(236, 72, 153, 0.3), rgba(139, 92, 246, 0.3))",
                    }}
                />

                {/* Glow Effect */}
                <motion.div
                    className="absolute inset-0 rounded-2xl"
                    animate={{
                        boxShadow: [
                            "0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(236, 72, 153, 0.2)",
                            "0 0 40px rgba(236, 72, 153, 0.4), 0 0 60px rgba(139, 92, 246, 0.3)",
                            "0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(236, 72, 153, 0.2)",
                        ]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
            </motion.div>
        </motion.div>
    );
};

const ShuffleHero = ({ handleEarlyAccess }: { handleEarlyAccess?: MouseEventHandler<HTMLButtonElement> }) => {
    return (
        <section className="w-full px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 max-w-7xl mx-auto">
            {/* Text Content */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <motion.span 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    <span className="text-2xl">🌍</span>
                    <span className="text-sm font-medium text-purple-300">{EN_FEATURE_THREE.badge}</span>
                </motion.span>
                
                <h3 
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
                    style={{ fontFamily: "'Clash Display', 'Outfit', sans-serif" }}
                >
                    {EN_FEATURE_THREE.title}
                </h3>
                
                <p className="text-lg md:text-xl text-white/70 leading-relaxed">
                    {EN_FEATURE_THREE.description}
                </p>

                {/* Language Tags */}
                <div className="flex flex-wrap gap-3 mt-8">
                    {["English", "Hindi", "Telugu"].map((lang, idx) => (
                        <motion.span
                            key={lang}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * idx }}
                            viewport={{ once: true }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm font-medium backdrop-blur-sm hover:bg-white/20 transition-colors cursor-default"
                        >
                            {lang}
                        </motion.span>
                    ))}
                </div>
            </motion.div>

            {/* 3D Language Blocks */}
            <div className="relative h-[400px] md:h-[500px]" style={{ perspective: "1200px" }}>
                {/* Central rotating container */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* Floating particles */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-purple-500/50 rounded-full"
                            style={{
                                left: `${20 + Math.random() * 60}%`,
                                top: `${20 + Math.random() * 60}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                opacity: [0.3, 0.8, 0.3],
                                scale: [1, 1.5, 1],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </motion.div>

                {/* 3D Blocks - positioned in a triangular formation */}
                <Language3DBlock 
                    src={EN_FEATURE_THREE.squareData[0].src}
                    label={EN_FEATURE_THREE.squareData[0].label || "English"}
                    delay={0}
                    position={{ x: 35, y: 5, z: 0 }}
                />
                <Language3DBlock 
                    src={EN_FEATURE_THREE.squareData[1].src}
                    label={EN_FEATURE_THREE.squareData[1].label || "Hindi"}
                    delay={0.3}
                    position={{ x: 10, y: 45, z: 0 }}
                />
                <Language3DBlock 
                    src={EN_FEATURE_THREE.squareData[2].src}
                    label={EN_FEATURE_THREE.squareData[2].label || "Telugu"}
                    delay={0.6}
                    position={{ x: 55, y: 50, z: 0 }}
                />

                {/* Background glow */}
                <motion.div
                    className="absolute inset-0 -z-10"
                    animate={{
                        background: [
                            "radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
                            "radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)",
                            "radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
                        ]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
            </div>
        </section>
    );
};

const FeatureThree = ({ handleEarlyAccess }: { handleEarlyAccess?: MouseEventHandler<HTMLButtonElement> }) => {
    return (
        <div className="relative flex w-full min-h-screen justify-center items-center overflow-hidden">
            <AnimatedBackground />
            <div className="relative z-10 w-full h-full flex items-center">
                <ShuffleHero handleEarlyAccess={handleEarlyAccess} />
            </div>
        </div>
    );
};

export default FeatureThree;
