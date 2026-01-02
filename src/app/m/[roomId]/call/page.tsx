"use client";

import CallInterface from "@/components/call/CallInterface";
import AppBackground from "@/components/main/AppBackground";
import AppList from "@/components/main/AppList";
import AppSidebar from "@/components/main/AppSidebar";
import { LiveAPIProvider } from "@/components/audio/LiveAPIContext";
import { useAuth } from "@/components/AuthContext";
import { useRoom } from "@/hooks/useRoom";
import { usePersona } from "@/hooks/usePersona";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Room, Persona } from "@/lib/firebase/dbTypes";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CallPage() {
  const router = useRouter();
  // Read public key (bundled at build time)
  const apiKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "").trim();

  const { user } = useAuth();
  const { fetchRoom } = useRoom();
  const { fetchPersona } = usePersona();
  const params = useParams();
  const roomId = params?.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch room and persona data
  useEffect(() => {
    if (!roomId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedRoom = await fetchRoom(roomId);
        if (!fetchedRoom) {
          setError("Room not found");
          return;
        }

        setRoom(fetchedRoom);
        const personaData = await fetchPersona(fetchedRoom.personaId);
        if (personaData) {
          setPersona(personaData);
        } else {
          setError("Persona not found");
        }
      } catch (err) {
        console.error("Error loading call data:", err);
        setError("Failed to load call data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [roomId, fetchRoom, fetchPersona]);

  // Sirf warning do, dev overlay mat trigger karo
  if (!apiKey) {
    console.warn("NEXT_PUBLIC_GEMINI_API_KEY is missing in CallPage");
  }

  if (loading) {
    return (
      <div className="fixed left-0 right-0 h-screen flex flex-col items-center justify-center bg-background text-foreground z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Initializing voice chat...</p>
      </div>
    );
  }

  if (error || !room || !persona) {
    return (
      <div className="fixed left-0 right-0 h-screen flex flex-col items-center justify-center bg-background text-foreground z-50">
        <p className="text-destructive mb-4">{error || "Unable to load session"}</p>
        <Button onClick={() => router.push(`/m/${roomId}/chat`)}>
          Back to Chat
        </Button>
      </div>
    );
  }

  return (
    <AppBackground>
      <div className="hidden md:block">
        <AppSidebar />
        <AppList />
      </div>
      <LiveAPIProvider apiKey={apiKey}>
        <CallInterface room={room} persona={persona} />
      </LiveAPIProvider>
    </AppBackground>
  );
}
