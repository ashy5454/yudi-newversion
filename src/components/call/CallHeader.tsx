import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import { ChevronLeftIcon, MessageSquare, MoreVerticalIcon, PhoneIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useRouter } from "next/navigation";
import { Room } from "@/lib/firebase/dbTypes";
import { formatRelativeTime } from "@/lib/utils";
import { useTyping } from "@/contexts/TypingContext";

interface CallHeaderProps {
    room: Room;
}

export default function CallHeader({ room }: CallHeaderProps) {
    const isMobile = useIsMobile();
    const router = useRouter();
    const { isTyping } = useTyping();
    const typing = isTyping(room.id);

    const handleBackClick = () => {
        if (isMobile) {
            router.replace('/m');
        }
    };

    const handleChatClick = () => {
        router.push(`/m/${room.id}/chat`);
    }

    return (
        <>
            <div className="w-full px-2 pt-2">
                <div className="bg-background/60 rounded-2xl flex flex-row w-full h-full p-2">
                    {/* Back Button */}
                    {isMobile && (
                        <Button variant={"ghost"} size={"icon"} className="mr-2" onClick={handleBackClick}>
                            <ChevronLeftIcon />
                        </Button>
                    )}

                    {/* User Detail */}
                    <div className="flex-1 flex flex-row cursor-pointer">
                        <Avatar className="border-2 border-primary/60 shadow-sm">
                            <AvatarImage src={room.avatarUrl} alt={room.title} />
                            <AvatarFallback className="text-primary font-bold text-lg" style={{ backgroundColor: room.bodyColor }}>
                                <div className="w-6 h-6 relative">
                                    {/* Eyes */}
                                    <span className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 left-0.5"></span>
                                    <span className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 right-0.5"></span>

                                    {/* Smile */}
                                    <span className="absolute w-6 h-4 border-b-2 border-black rounded-b-full bottom-0 left-1/2 transform -translate-x-1/2"></span>
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

                    {/* Action Buttons */}
                    <div className="flex flex-row gap-2">
                        <Button variant={"ghost"} size={"icon"} onClick={handleChatClick}>
                            <MessageSquare />
                        </Button>
                        {/* <Button variant={"ghost"} size={"icon"}>
                           <MoreVerticalIcon /> 
                        </Button> */}
                    </div>

                </div>
            </div>
        </>
    );
}