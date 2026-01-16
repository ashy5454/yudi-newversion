import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Room } from "@/lib/firebase/dbTypes";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "../ui/button";
import { PhoneIcon } from "lucide-react";
import { useTyping } from "@/contexts/TypingContext";

interface AppListItemProps {
    room: Room;
    showOnline?: boolean; // Whether to show "online" status (dynamically shuffled)
}

function AppListItem({ room, showOnline = false }: AppListItemProps) {
    const router = useRouter();
    const { isTyping } = useTyping();
    const typing = isTyping(room.id);

    const handleChatClick = () => {
        router.push(`/m/${room.id}/chat`);
    };

    const handleCallClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/m/${room.id}/call`);
    };
    
    // Show online/typing for selected personas (dynamically shuffled), last message for others
    const statusText = showOnline 
        ? (typing ? 'typing...' : 'online')
        : (room.lastMessageContent || 'No messages yet...');

    return (
        <>
            {/* Chat Item */}
            <div className="cursor-pointer bg-background/60 rounded-xl mb-2 p-2 flex flex-row items-center justify-between hover:bg-secondary hover:text-secondary-foreground transition-colors drop-shadow-lg mx-1 md:mx-0 group relative">
                <div onClick={handleChatClick} className="flex-1 flex flex-row items-center">
                    <Avatar>
                        <AvatarImage src={room.avatarUrl} />
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
                    <div className="flex-1 px-4 flex-col">
                        <div className="font-normal text-xl cursor-pointer font-sans">
                            {room.title || `Chat ${room.id.slice(0, 8)}`}
                        </div>
                        <span className="opacity-50 text-sm font-serif">
                            {statusText}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    {(room.messageCount && room.messageCount > 0) ? (
                        <Badge className="h-4 w-4 rounded-full">
                            {room.messageCount}
                        </Badge>
                    ) : null}
                    {room.updatedAt && (
                        <div className="text-xs opacity-50">
                            {formatRelativeTime(room.updatedAt)}
                        </div>
                    )}

                    {/* Call Button - Visible on hover or always on mobile */}
                    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-primary/20"
                            onClick={handleCallClick}
                        >
                            <PhoneIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div >
        </>
    );
}

export default AppListItem;