"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { EN_FAQS } from '@/content/en'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import { motion } from 'framer-motion'
import AnimatedBackground from './AnimatedBackground'
import { Heart, Phone, Sparkles, MessageCircle } from 'lucide-react'

export default function Faqs() {
    return (
        <section className="relative min-h-screen w-full flex items-center py-16">
            <AnimatedBackground />
            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
                <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
                    {/* Left Side - Title & Contact */}
                    <motion.div 
                        className="lg:w-1/3"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <div className="lg:sticky lg:top-24">
                            {/* Section Title */}
                            <h2 
                                className="text-4xl md:text-5xl font-bold text-white mb-8"
                                style={{ fontFamily: "'Clash Display', 'Outfit', sans-serif" }}
                            >
                                {EN_FAQS.title}
                            </h2>
                            
                            {/* Creative Contact Card */}
                            <motion.div 
                                className="relative mt-8 p-6 rounded-3xl overflow-hidden"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                viewport={{ once: true }}
                            >
                                {/* Gradient Background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-purple-600/30 backdrop-blur-xl" />
                                <div className="absolute inset-0 border border-white/20 rounded-3xl" />
                                
                                {/* Floating Hearts */}
                                <motion.div
                                    className="absolute top-4 right-4"
                                    animate={{ 
                                        y: [0, -10, 0],
                                        rotate: [0, 10, 0, -10, 0],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
                                </motion.div>
                                
                                <motion.div
                                    className="absolute bottom-6 left-6"
                                    animate={{ 
                                        y: [0, 8, 0],
                                        rotate: [0, -15, 0, 15, 0]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                                >
                                    <Sparkles className="w-6 h-6 text-purple-400" />
                                </motion.div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <motion.p 
                                        className="text-2xl md:text-3xl font-bold text-white mb-2"
                                        style={{ fontFamily: "'Clash Display', 'Outfit', sans-serif" }}
                                        animate={{ 
                                            textShadow: [
                                                "0 0 10px rgba(236, 72, 153, 0)",
                                                "0 0 20px rgba(236, 72, 153, 0.5)",
                                                "0 0 10px rgba(236, 72, 153, 0)",
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {EN_FAQS.contact.title} 
                                        <motion.span 
                                            className="inline-block ml-2"
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            {EN_FAQS.contact.emoji}
                                        </motion.span>
                                    </motion.p>
                                    
                                    {/* Phone Numbers with Animation */}
                                    <div className="space-y-3 mt-6">
                                        {EN_FAQS.contact.phones.map((phone, idx) => (
                                            <motion.a
                                                key={phone}
                                                href={`tel:${phone}`}
                                                className="flex items-center gap-3 group"
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + idx * 0.1 }}
                                                viewport={{ once: true }}
                                                whileHover={{ x: 5 }}
                                            >
                                                <motion.div
                                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-green-500/30 transition-colors"
                                                    whileHover={{ rotate: [0, -10, 10, 0] }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <Phone className="w-5 h-5 text-green-400" />
                                                </motion.div>
                                                <span 
                                                    className="text-xl md:text-2xl font-bold text-white/90 group-hover:text-white transition-colors"
                                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                                >
                                                    {phone}
                                                </span>
                                            </motion.a>
                                        ))}
                                    </div>

                                    {/* Chat CTA */}
                                    <motion.div
                                        className="mt-6 pt-4 border-t border-white/10"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        viewport={{ once: true }}
                                    >
                                        <p className="text-white/60 text-sm flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4" />
                                            slide into our DMs anytime bestie ✨
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right Side - FAQ Accordion */}
                    <motion.div 
                        className="lg:w-2/3"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full space-y-3"
                        >
                            {EN_FAQS.faqItems.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    viewport={{ once: true }}
                                >
                                    <AccordionItem
                                        value={item.id}
                                        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-6 overflow-hidden hover:bg-white/[0.08] transition-colors"
                                    >
                                        <AccordionTrigger className="cursor-pointer items-center py-5 hover:no-underline group">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
                                                    <DynamicIcon
                                                        name={item.icon as IconName}
                                                        className="w-5 h-5 text-purple-400"
                                                    />
                                                </div>
                                                <span className="text-base md:text-lg text-white font-medium text-left">
                                                    {item.question}
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-5">
                                            <div className="pl-14">
                                                <p className="text-base text-white/70 leading-relaxed">
                                                    {item.answer}
                                                </p>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                            ))}
                        </Accordion>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
