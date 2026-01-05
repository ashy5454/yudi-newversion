import { NextRequest, NextResponse } from "next/server";
import { MessageAdminDb, RoomAdminDb } from '@/lib/firebase/adminDb';
import { isFirebaseEnabled } from '@/lib/firebase/firebase-admin';
import { Message } from "@/lib/firebase/dbTypes";

export async function POST(req: NextRequest) {
    try {
        const { roomId, personaId } = await req.json();

        if (!roomId || !personaId) {
            return NextResponse.json(
                { message: 'roomId and personaId are required' },
                { status: 400 }
            );
        }

        // Check if room has any messages at all (FIRST CONVERSATION CHECK)
        let hasAnyMessages = false;
        if (isFirebaseEnabled) {
            try {
                const history = await MessageAdminDb.getByRoomId(roomId, 1); // Only need to check if ANY messages exist
                hasAnyMessages = history.messages.length > 0;
                console.log(`[Init] Room ${roomId} has ${history.messages.length} messages. First conversation: ${!hasAnyMessages}`);
            } catch (error) {
                console.error("Error checking messages:", error);
                // If we can't check, assume no messages and send initial message
            }
        }

        // ONLY send greeting if this is the FIRST conversation (no messages at all)
        // If there are previous messages (even after 4 hours), DO NOT send greeting
        // The 4-hour check-in will handle re-engagement with "where were you" style messages
        if (!hasAnyMessages) {
            const initialMessage: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
                roomId,
                personaId,
                senderType: "persona",
                content: "heyyyy how you doingg",
                messageType: "text",
                isRead: false,
                isSent: true,
                isReceived: true,
                isDelivered: true,
                isEdited: false,
                isDeleted: false,
                isSystemMessage: false,
                isError: false,
                status: 'sent'
            };

            if (isFirebaseEnabled) {
                try {
                    await MessageAdminDb.create(initialMessage);
                    await RoomAdminDb.updateLastMessage(roomId, "heyyyy how you doingg");
                    return NextResponse.json({ 
                        success: true, 
                        message: "Initial greeting sent",
                        content: "heyyyy how you doingg"
                    });
                } catch (error) {
                    console.error("Error saving initial message:", error);
                    // Return success anyway so frontend can show the message
                    return NextResponse.json({ 
                        success: true, 
                        message: "Initial greeting (not saved to DB)",
                        content: "heyyyy how you doingg"
                    });
                }
            } else {
                // Return message even if DB is not available
                return NextResponse.json({ 
                    success: true, 
                    message: "Initial greeting (DB not available)",
                    content: "heyyyy how you doingg"
                });
            }
        } else {
            return NextResponse.json({ 
                success: false, 
                message: "Room already has initial greeting message" 
            });
        }
    } catch (error) {
        console.error("Error in init endpoint:", error);
        return NextResponse.json(
            { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

