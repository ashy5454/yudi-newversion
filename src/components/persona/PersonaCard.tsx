import React, { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { LoaderIcon, MessageSquareIcon, Star } from "lucide-react";
import FeatureButton from "../main/FeatureButton";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { Persona } from "@/lib/firebase/dbTypes";
import { useAuth } from "@/components/AuthContext";
import { useRoom } from "@/hooks/useRoom";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";

export default function PersonaCard({ personaId, persona }: { personaId: string, persona: Persona }) {
    const router = useRouter();
    const { user } = useAuth();
    const { rooms, createRoom, loading } = useRoom();
    const [actionLoading, setActionLoading] = useState(false);

    // Helper to find a room for this personaId
    const findRoomForPersona = () => {
        if (!user) return null;
        return rooms.find(room => room.personaId === personaId && room.userId === user.uid && !room.isArchived);
    };

    const handleNavigate = async (type: "chat" | "call") => {
        if (!user) {
            toast.error("You must be logged in to start a conversation.");
            return;
        }
        setActionLoading(true);
        try {
            let room = findRoomForPersona();
            let roomId = room?.id ?? null;
            if (!roomId) {
                // Create a new room if not found
                roomId = await createRoom({ userId: user.uid, personaId: personaId, title: persona.name, avatarUrl: persona.avatarUrl, bodyColor: persona.bodyColor });
                if (!roomId) throw new Error("Failed to create room");
            }
            if (!roomId) {
                toast.error("Failed to create room");
                return;
            }
            router.replace(`/m/${roomId}/${type}`);
        } catch (err: any) {
            toast.error(err.message || "Failed to start conversation");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Card className="max-w-md shadow-xl border border-muted bg-background/60 rounded-2xl transition-all hover:shadow-2xl drop-shadow-2xl">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/60 shadow-sm">
                    <AvatarImage src={persona.avatarUrl} alt={persona.name} />
                    <AvatarFallback className="text-primary font-bold text-lg" style={{ backgroundColor: persona.bodyColor }}>
                        <div className="w-6 h-6 relative">
                            {/* Eyes */}
                            <span className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 left-0.5"></span>
                            <span className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 right-0.5"></span>

                            {/* Smile */}
                            <span className="absolute w-6 h-4 border-b-2 border-black rounded-b-full bottom-0 left-1/2 transform -translate-x-1/2"></span>
                        </div>
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="font-semibold text-2xl font-sans text-foreground">{persona.name}</h2>
                    <div className="flex flex-wrap gap-4 mb-3 text-sm text-foreground/80">
                        <span>{persona.gender}</span>
                        <span>{persona.language}</span>
                        <span>{persona.age}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        {/* {isActive && (
                            <span className="flex items-center gap-1 text-green-500 text-xs font-medium">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Active
                            </span>
                        )} */}
                        {/* {isPublic && (
                            <Badge variant="outline" className="text-xs border-primary/30 bg-primary/10 text-primary ml-2">
                                Public
                            </Badge>
                        )} */}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <p className="text-base mb-3 text-muted-foreground max-h-[76px] overflow-hidden text-ellipsis">{persona.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                    {persona.tags?.map(tag => (
                        <Badge
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border-border"
                            variant="secondary"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>
                {/* <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <span className="font-semibold text-foreground">{persona.usageCount}</span>
                        <span className="hidden sm:inline">uses</span>
                    </span>
                    {persona.rating && (
                        <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-300" />
                            <span className="font-semibold text-foreground">{persona.rating.toFixed(1)}</span>
                        </span>
                    )}
                </div> */}
            </CardContent>
            <CardFooter className="flex flex-row justify-between items-center">
                <FeatureButton content="Call" onClick={() => handleNavigate("call")} />
                <Button
                    variant="secondary"
                    className="rounded-full flex items-center bg-primary/10 text-primary hover:bg-primary/20 transition"
                    onClick={() => handleNavigate("chat")}
                    disabled={actionLoading || loading}
                >
                    {actionLoading || loading ?
                        <LoaderIcon className="w-4 h-4 animate-spin" /> :
                        <MessageSquareIcon className="w-4 h-4" />}
                    <span className="font-medium">Chat</span>

                </Button>

            </CardFooter>
        </Card>
    );
}