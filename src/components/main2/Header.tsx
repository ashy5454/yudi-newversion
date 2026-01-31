"use client";

import { Button } from "../ui/button";
import { useState, type MouseEventHandler } from "react";
import { Logo } from "./Logo";
import { Menu, X, Sparkles } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { EN_HEADER } from "@/content/en";
import { motion, AnimatePresence } from "framer-motion";

export default function Header({ handleEarlyAccess }: { handleEarlyAccess?: MouseEventHandler<HTMLButtonElement> }) {
    const [menuState, setMenuState] = useState(false);
    
    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/5" />
            
            <nav className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <motion.div 
                        className="flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Logo />
                    </motion.div>

                    {/* Desktop Navigation */}
                    <motion.div 
                        className="hidden lg:flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <ul className="flex items-center">
                            {EN_HEADER.menuItems.map((item, index) => (
                                <li key={index}>
                                    <a
                                        href={item.to}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const element = document.querySelector(item.to);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            } else if (item.to === '#about') {
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                            setMenuState(false);
                                        }}
                                        className="relative px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 group"
                                    >
                                        <span>{item.name}</span>
                                        {/* Hover Underline */}
                                        <span className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Right Side Actions */}
                    <motion.div 
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Theme Toggle - Desktop */}
                        <div className="hidden lg:block">
                            <ThemeToggle />
                        </div>
                        
                        {/* CTA Button */}
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                onClick={handleEarlyAccess}
                                className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-5 py-2.5 rounded-full border-0 shadow-lg shadow-purple-500/20"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    {EN_HEADER.cta.text}
                                </span>
                                {/* Shimmer Effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                />
                            </Button>
                        </motion.div>
                        
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMenuState(!menuState)}
                            aria-label={menuState ? "Close Menu" : "Open Menu"}
                            className="relative z-20 p-2 lg:hidden text-white/80 hover:text-white transition-colors"
                        >
                            <AnimatePresence mode="wait">
                                {menuState ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <X className="w-6 h-6" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Menu className="w-6 h-6" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </motion.div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {menuState && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="lg:hidden overflow-hidden"
                        >
                            <div className="pt-4 pb-2 border-t border-white/10 mt-3">
                                <ul className="space-y-1">
                                    {EN_HEADER.menuItems.map((item, index) => (
                                        <motion.li 
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <a
                                                href={item.to}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const element = document.querySelector(item.to);
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }
                                                    setMenuState(false);
                                                }}
                                                className="block px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                            >
                                                {item.name}
                                            </a>
                                        </motion.li>
                                    ))}
                                </ul>
                                <div className="mt-4 px-4">
                                    <ThemeToggle />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
}
