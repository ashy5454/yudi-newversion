"use client"
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AI_Input_Search from "../kokonutui/ai-input-search";

export default function ChatInput({ roomId, personaId }: { roomId: string, personaId: string }) {
    const params = useParams();
    const router = useRouter();
    const [isTyping, setIsTyping] = useState(false);

    const handleSend = async (text: string) => {
        if (!text.trim() || !roomId) return;

        // Show typing indicator
        setIsTyping(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    roomId,
                    personaId
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Message sent successfully:', data);
        } catch (error) {
            console.error('Error sending message:', error);
            // You might want to show an error toast here
        } finally {
            setIsTyping(false);
        }
    };

    const handleFeatureButtonClick = () => {
        router.push(`/m/${roomId}/call`);
    }

    return (
        <>
            <div className="w-full px-2 pb-2">
                <div className="bg-background/80 rounded-2xl flex flex-row w-full h-full drop-shadow-2xl">
                    <AI_Input_Search handleSend={handleSend} handleFeatureButtonClick={handleFeatureButtonClick} />
                </div>
            </div>
        </>
    );
}