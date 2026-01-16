"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import { ChevronLeftIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useRouter } from "next/navigation";
import { Room } from "@/lib/firebase/dbTypes";
import { useTyping } from "@/contexts/TypingContext";

interface ChatHeaderProps {
    room: Room;
}

export default function ChatHeader({ room }: ChatHeaderProps) {
    const isMobile = useIsMobile();
    const router = useRouter();
    const { isTyping } = useTyping();
    const typing = isTyping(room.id);

    const handleBackClick = () => {
        if (isMobile) {
            router.replace("/m");
        }
    };

    return (
        <div className="w-full px-2 pt-2">
            <div className="bg-background/60 rounded-2xl flex flex-row w-full h-full p-2">

                {/* Back Button */}
                {isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2"
                        onClick={handleBackClick}
                    >
                        <ChevronLeftIcon />
                    </Button>
                )}

                {/* User Detail */}
                <div className="flex-1 flex flex-row cursor-pointer">
                    <Avatar className="border-2 border-primary/60 shadow-sm">
                        <AvatarImage src={room.avatarUrl} alt={room.title} />
                        <AvatarFallback
                            className="text-primary font-bold text-lg"
                            style={{ backgroundColor: room.bodyColor }}
                        >
                            <div className="w-6 h-6 relative">
                                <span className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 left-0.5"></span>
                                <span className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 right-0.5"></span>
                                <span className="absolute w-6 h-4 border-b-2 border-black rounded-b-full bottom-0 left-1/2 -translate-x-1/2"></span>
                            </div>
                        </AvatarFallback>
                    </Avatar>

                    <div className="px-2">
                        <div className="font-normal -mb-1 font-sans">
                            {room.title || `Chat ${room.id.slice(0, 8)}`}
                        </div>
                        <span className="opacity-50 text-xs font-serif">
                            {typing ? 'typing...' : 'online'}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
