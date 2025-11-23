import { NextRequest, NextResponse } from "next/server";
import { MessageAdminDb, PersonaAdminDb, RoomAdminDb } from '@/lib/firebase/adminDb';
import { Message } from "@/lib/firebase/dbTypes";

export async function GET() {
    return NextResponse.json({ message: 'API is working' });
}

export async function POST(req: NextRequest) {
    const { text, roomId, personaId, senderType = 'user', messageType = 'text', metadata } = await req.json();

    if (!text || !roomId || !senderType) {
        return NextResponse.json(
            { message: 'Text, roomId, and senderType are required' },
            { status: 400 }
        );
    }

    console.log("text: ", text, roomId, personaId, senderType, messageType, metadata);

    // fetch persona
    const persona = await PersonaAdminDb.getById(personaId);
    if (!persona) {
        console.log("Persona not found");
        return NextResponse.json(
            { message: 'Persona not found' },
            { status: 404 }
        );
    }

    // fetch chat history
    const history = await MessageAdminDb.getByRoomId(roomId, personaId, 10);
    if (!history) {
        console.log("Chat history not found");
    }

    // 1. Generate AI response
    // Build comprehensive system instruction with all persona details
    const systemInstructionParts = [];

    // Add persona identity and characteristics
    systemInstructionParts.push(`You are ${persona.name}.`);

    if (persona.description) {
        systemInstructionParts.push(`About you: ${persona.description}`);
    }

    if (persona.age) {
        systemInstructionParts.push(`Your age: ${persona.age} years old.`);
    }

    if (persona.gender) {
        systemInstructionParts.push(`Your gender: ${persona.gender}.`);
    }

    if (persona.personality) {
        systemInstructionParts.push(`Your personality: ${persona.personality}`);
    }

    if (persona.language) {
        systemInstructionParts.push(`Preferred language: ${persona.language}`);
    }

    if (persona.category) {
        systemInstructionParts.push(`Your role: ${persona.category}`);
    }

    // Add user's custom prompt if provided
    if (persona.userPrompt) {
        systemInstructionParts.push(`\nAdditional instructions: ${persona.userPrompt}`);
    }

    // Add model's base system prompt
    systemInstructionParts.push(`\n${persona.model.systemPrompt}`);

    const systemInstruction = systemInstructionParts.join('\n');

    console.log("System Instruction:", systemInstruction);

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        return NextResponse.json(
            { message: 'GEMINI_API_KEY is not configured' },
            { status: 500 }
        );
    }

    // Build contents array with history
    const contents = history.messages.map((m) => ({
        role: m.senderType === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    // Add current user message
    contents.push({
        role: 'user',
        parts: [{ text: text }]
    });

    // Call Gemini API directly
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${persona.model.textModel}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                }
            })
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        return NextResponse.json(
            { message: `Gemini API error: ${errorData.error?.message || 'Unknown error'}` },
            { status: response.status }
        );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';

    console.log("Chat response", responseText);

    // 2. Store both the messages in Firestore (adminDb)
    let messageId: string | null = null;
    try {
        // Clean the message data to remove undefined values
        const messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
            roomId,
            personaId: personaId,
            senderType: "persona",
            content: responseText || '',
            messageType,
            isRead: false,
            isSent: false,
            isReceived: false,
            isDelivered: false,
            isEdited: false,
            isDeleted: false,
            isSystemMessage: false,
            isError: false,
            status: 'sent'
        };

        const messageData2: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
            roomId,
            personaId: personaId,
            senderType: 'user',
            content: text,
            messageType,
            isRead: true,
            status: 'sent',
            isSent: true,
            isReceived: true,
            isDelivered: true,
            isEdited: false,
            isDeleted: false,
            isSystemMessage: false,
            isError: false
        };

        if (responseText) {
            await RoomAdminDb.updateLastMessage(roomId, responseText.slice(0, 10));
        }

        // Only add metadata if it's not undefined
        if (metadata !== undefined && metadata !== null) {
            messageData.metadata = metadata;
            messageData2.metadata = metadata;
        }
        const messageId2 = await MessageAdminDb.create(messageData2);
        messageId = await MessageAdminDb.create(messageData);
        console.log("messageId: ", messageId, " messageData2.id: ", messageId2);
    } catch (e) {
        // Log error but still return AI response
        console.error('Error saving message to Firestore:', e);
    }

    return NextResponse.json(
        { message: responseText || 'No response from AI', messageId },
        { status: 201 }
    );
}
