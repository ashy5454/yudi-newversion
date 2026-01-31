"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { EN_FOOTER } from "@/content/en";
import { motion } from "framer-motion";

const Footer: React.FC = () => {
    return (
        <footer className="relative w-full bg-gradient-to-b from-[#0B0F19] to-black/95 pt-8 pb-4">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                {/* Main Footer Content */}
                <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20">
                    {/* Logo & Description */}
                    <div className="lg:max-w-sm">
                        <Logo />
                        <p className="mt-4 text-sm text-white/60 leading-relaxed">
                            {EN_FOOTER.description}
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex flex-row gap-16 md:gap-24">
                        {EN_FOOTER.links.map((link, index) => (
                            <div key={index} className="space-y-3">
                                <span className="block text-sm font-semibold text-white/90">
                                    {link.group}
                                </span>
                                {link.items.map((item, idx) => (
                                    <Link
                                        key={idx}
                                        href={item.to}
                                        className="text-white/50 hover:text-white block text-sm transition-colors duration-200"
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="mt-6 border-t border-white/10" />

                {/* Bottom Bar - Slimmer */}
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Copyright */}
                    <span className="text-white/50 text-xs order-last md:order-first">
                        © {new Date().getFullYear()}{EN_FOOTER.footerText}
                    </span>

                    {/* Social Links */}
                    <div className="flex items-center gap-4 order-first md:order-last">
                        {EN_FOOTER.socialLinks.map((icon, index) => (
                            <motion.div key={index} whileHover={{ scale: 1.1, y: -2 }}>
                                <Link
                                    href={icon.to}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={icon.label}
                                    className="text-white/40 hover:text-white transition-colors duration-200"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                    >
                                        <path fill="currentColor" d={icon.svgPath} />
                                    </svg>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
