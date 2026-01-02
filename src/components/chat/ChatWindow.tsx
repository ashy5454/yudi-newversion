"use client";
import { CheckCheckIcon, CheckIcon, LoaderIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { LoaderOne } from "../ui/loader";
import { useParams } from "next/navigation";
import { Message } from "@/lib/firebase/dbTypes";
import { useAuth } from "@/components/AuthContext";
import { formatTime } from "@/lib/utils";

interface ChatWindowProps {
    messages: Message[];
    loading?: boolean;
    error?: string | null;
    isGenerating?: boolean;
}

export default function ChatWindow({ messages, loading, error, isGenerating }: ChatWindowProps) {
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const { user } = useAuth();

    // params and useMessage hooks are removed as data is passed via props

    // useLayoutEffect fires BEFORE the browser paints, preventing the visual "jump"
    // Using "auto" instead of "smooth" prevents the "bouncy" rolling effect during spam attacks
    useLayoutEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [messages, isGenerating]); // Added isGenerating to dependencies to scroll when typing indicator appears

    const leftChatBubble = ({ id, content, time, isTyping = false, isSkeleton = false }: { id: string, content?: string, time?: string, isTyping?: boolean, isSkeleton?: boolean }) => {
        return (
            <div key={id}>
                {!isSkeleton ? (
                    <div className="flex justify-start py-1 px-2">
                        {!isTyping ? (
                            <div className="bg-white p-2 rounded-lg shadow-md max-w-[85vw] md:max-w-[70vw] w-fit rounded-tl-none">
                                <p className="text-gray-800">{content}</p>
                                {time && (<p className="flex flex-row text-xs text-black/40 mt-0.5">{time}</p>)}
                            </div>
                        ) : (
                            <div className="bg-black p-3 rounded-lg shadow-md max-w-[85vw] md:max-w-[70vw] w-fit rounded-tl-none">
                                <LoaderOne />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-start py-1 px-2">
                        <div className="bg-gray-200 p-2 rounded-lg shadow-md max-w-[85vw] md:max-w-[70vw] w-fit rounded-tl-none animate-pulse">
                            <Skeleton className="bg-background h-6 w-[65vw] md:w-[50vw] mb-1" />
                            <Skeleton className="bg-background h-2 w-8" />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const systemChatBubble = ({ statusType, date, errorMessage }: { statusType: "loading" | "date" | "error", date?: string, errorMessage?: string }) => {
        return (
            <div className="flex justify-center py-2 px-2">
                {statusType === "loading" && (
                    <Badge variant={"outline"}><LoaderIcon className="animate-spin" /></Badge>
                )}
                {statusType === "date" && (
                    <Badge variant={"outline"}>{date}</Badge>
                )}
                {statusType === "error" && (
                    <Badge variant={"destructive"}>{errorMessage}</Badge>
                )}
            </div>
        );
    };

    const rightChatBubble = ({ id, content, time, isSent = true, isSkeleton = false }: { id: string, content?: string, time?: string, isSent?: boolean, isSkeleton?: boolean }) => {
        return (
            <div key={id}>
                {!isSkeleton ? (
                    <div className="flex justify-end py-1 px-2">
                        <div className="bg-primary p-2 rounded-lg shadow-md max-w-[85vw] md:max-w-[70vw] w-fit rounded-br-none">
                            <p className="text-white">{content}</p>
                            <p className="flex flex-row text-xs float-end text-white/60 mt-0.5">{time} {isSent ? (<CheckCheckIcon className="size-3 ml-1 text-secondary" />) : (<CheckIcon className="size-3 ml-1" />)} </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end py-1 px-2">
                        <div className="bg-primary/20 p-2 rounded-lg shadow-md max-w-[85vw] md:max-w-[70vw] w-fit rounded-br-none animate-pulse">
                            <Skeleton className="bg-background h-6 w-[65vw] md:w-[50vw] mb-1" />
                            <Skeleton className="bg-background h-2 w-8 float-end" />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex-1 w-full p-2">
                <div className="bg-background/60 rounded-2xl flex flex-row w-full h-full">
                    <ScrollArea className="scroll-area flex flex-col w-full h-[calc(100dvh-190px)] md:h-[calc(100vh-270px)] overflow-y-auto overflow-anchor-auto scroll-smooth">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex flex-col">
                                {index % 2 === 0 ?
                                    leftChatBubble({ id: index.toString(), isSkeleton: true })
                                    : rightChatBubble({ id: index.toString(), isSkeleton: true })}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </ScrollArea>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 w-full p-2">
                <div className="bg-background/60 rounded-2xl flex flex-row w-full h-full">
                    <ScrollArea className="scroll-area flex flex-col w-full h-[calc(100dvh-190px)] md:h-[calc(100vh-270px)] overflow-y-auto overflow-anchor-auto scroll-smooth">
                        {systemChatBubble({ statusType: "error", errorMessage: `Error loading messages: ${error}` })}
                        <div ref={messagesEndRef} />
                    </ScrollArea>
                </div>
            </div>
        );
    }

    const uniqueMessages = Array.from(
        new Map(messages.map(msg => [msg.id, msg])).values()
    );
    
    // DEBUG: Log check-in messages in ChatWindow
    const checkInMessages = uniqueMessages.filter(m => m.senderType === 'persona' && m.content && m.content.includes('ekkada sachav'));
    if (checkInMessages.length > 0) {
        console.log(`🖥️ [ChatWindow] Rendering ${checkInMessages.length} check-in messages:`, 
            checkInMessages.map(m => ({ 
                id: m.id, 
                content: m.content.substring(0, 50),
                timestamp: m.createdAt,
                index: uniqueMessages.findIndex(msg => msg.id === m.id)
            }))
        );
        console.log(`📋 [ChatWindow] Total messages: ${uniqueMessages.length}, Check-in message positions:`, 
            checkInMessages.map(m => {
                const idx = uniqueMessages.findIndex(msg => msg.id === m.id);
                return `Message ${m.id.substring(0, 8)} at position ${idx}/${uniqueMessages.length - 1}`;
            })
        );
    }

    return (
        <>
            <div className="flex-1 w-full p-2">
                <div className="bg-background/60 rounded-2xl flex flex-row w-full h-full">
                    <ScrollArea className="scroll-area flex flex-col w-full h-[calc(100dvh-190px)] md:h-[calc(100vh-270px)] overflow-y-auto overflow-anchor-auto scroll-smooth">
                        {messages.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <Badge variant={"outline"}>No messages yet. Start a conversation!</Badge>
                            </div>
                        ) : (
                            <>
                                {uniqueMessages.map((message, index) => {
                                    // DEBUG: Log check-in messages when rendering
                                    if (message.senderType === 'persona' && message.content && message.content.includes('ekkada sachav')) {
                                        console.log(`🎨 [ChatWindow] Rendering check-in message at index ${index}:`, {
                                            id: message.id,
                                            content: message.content.substring(0, 50),
                                            hasContent: !!message.content,
                                            contentLength: message.content?.length || 0,
                                            createdAt: message.createdAt,
                                            formattedTime: formatTime(message.createdAt)
                                        });
                                    }
                                    
                                    // Skip messages with no content
                                    if (!message.content || message.content.trim() === '') {
                                        console.warn(`⚠️ [ChatWindow] Skipping message ${message.id} - no content`);
                                        return null;
                                    }
                                    
                                    return (
                                    <div key={message.id} className="flex flex-col">
                                        {message.senderType === "persona" ? (
                                            leftChatBubble({
                                                id: message.id,
                                                content: message.content,
                                                time: formatTime(message.createdAt)
                                            })
                                        ) : (
                                            rightChatBubble({
                                                id: message.id,
                                                content: message.content,
                                                time: formatTime(message.createdAt),
                                                isSent: message.isSent || false
                                            })
                                        )}
                                    </div>
                                    );
                                })}
                                {/* Typing Indicator */}
                                {isGenerating && (
                                    leftChatBubble({
                                        id: "typing-indicator",
                                        isTyping: true
                                    })
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </ScrollArea>
                </div>
            </div>
        </>
    );
}