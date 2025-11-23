"use client";
import { CheckCheckIcon, CheckIcon, LoaderIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { LoaderOne } from "../ui/loader";
import { useParams } from "next/navigation";
import { useMessage } from "@/hooks/useMessage";
import { useAuth } from "@/components/AuthContext";
import { formatTime } from "@/lib/utils";

export default function ChatWindow() {
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const params = useParams();
    const { user } = useAuth();
    const { messages, loading, error, fetchMessagesByRoom, subscribeToRoomMessages } = useMessage();
    const roomId = params?.roomId as string;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch messages when component mounts
    useEffect(() => {
        if (roomId && user?.uid) {
            fetchMessagesByRoom(roomId);
        }
    }, [roomId, user?.uid, fetchMessagesByRoom]);

    // Subscribe to real-time message updates
    useEffect(() => {
        if (roomId && user?.uid) {
            const unsubscribe = subscribeToRoomMessages(roomId);
            return () => unsubscribe();
        }
    }, [roomId, user?.uid, subscribeToRoomMessages]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const leftChatBubble = ({ id, content, time, isTyping = false, isSkeleton = false }: { id: string, content?: string, time?: string, isTyping?: boolean, isSkeleton?: boolean }) => {
        return (
            <div key={id}>
                {!isSkeleton ? (
                    <div className="flex justify-start py-1 px-2">
                        {!isTyping ? (
                            <div className="bg-white p-2 rounded-lg shadow-md max-w-[70vw] w-fit rounded-tl-none">
                                <p className="text-gray-800">{content}</p>
                                {time && (<p className="flex flex-row text-xs text-black/40 mt-0.5">{time}</p>)}
                            </div>
                        ) : (
                            <div className="bg-secondary/20 p-2 rounded-lg shadow-md max-w-[70vw] w-fit rounded-bl-none animate-pulse">
                                <LoaderOne />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-start py-1 px-2">
                        <div className="bg-gray-200 p-2 rounded-lg shadow-md max-w-[70vw] w-fit rounded-tl-none animate-pulse">
                            <Skeleton className="bg-background h-6 w-[50vw] mb-1" />
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
                        <div className="bg-primary p-2 rounded-lg shadow-md max-w-[70vw] w-fit rounded-br-none">
                            <p className="text-white">{content}</p>
                            <p className="flex flex-row text-xs float-end text-white/60 mt-0.5">{time} {isSent ? (<CheckCheckIcon className="size-3 ml-1 text-secondary" />) : (<CheckIcon className="size-3 ml-1" />)} </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end py-1 px-2">
                        <div className="bg-primary/20 p-2 rounded-lg shadow-md max-w-[70vw] w-fit rounded-br-none animate-pulse">
                            <Skeleton className="bg-background h-6 w-[50vw] mb-1" />
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
                    <ScrollArea className="scroll-area flex flex-col w-full h-[calc(100vh-270px)] overflow-y-auto">
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
                    <ScrollArea className="scroll-area flex flex-col w-full h-[calc(100vh-270px)] overflow-y-auto">
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

    return (
        <>
            <div className="flex-1 w-full p-2">
                <div className="bg-background/60 rounded-2xl flex flex-row w-full h-full">
                    <ScrollArea className="scroll-area flex flex-col w-full h-[calc(100vh-270px)] overflow-y-auto">
                        {messages.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <Badge variant={"outline"}>No messages yet. Start a conversation!</Badge>
                            </div>
                        ) : (
                            <>
                                {uniqueMessages.map((message) => (
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
                                ))}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </ScrollArea>
                </div>
            </div>
        </>
    );
}