"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AI_Input_Search from "../kokonutui/ai-input-search";
import { MessageClientDb } from "@/lib/firebase/clientDb";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthContext";
import { startTextTrial, useAccessControl } from "@/hooks/useAccessControl";

export default function ChatInput({ roomId, personaId, onMessageSent, onSynthesizing, onMessageStream, lastMessageTime, onUserTyping }: { roomId: string; personaId: string; onMessageSent?: (message: any) => void; onSynthesizing?: (isSynthesizing: boolean) => void; onMessageStream?: (id: string, chunk: string) => void; lastMessageTime?: Date | number; onUserTyping?: () => void }) {
    const router = useRouter();
    const { user } = useAuth();
    const { isTextTrialExpired, isApproved } = useAccessControl();
    const [isTyping, setIsTyping] = useState(false);
    const isSendingRef = useRef(false); // 🛑 Prevent double-fire
    const hasStartedTrialRef = useRef(false); // Track if we've started the trial

    const handleSend = async (text: string) => {

        // 🛑 Prevent double-fire: If already sending, ignore this call
        if (isSendingRef.current) {
            console.log("[ChatInput] Ignoring duplicate send request");
            return;
        }

        if (!text.trim() || !roomId || !personaId) {
            return;
        }

        // 🛑 Block if text trial is expired (unless approved)
        if (isTextTrialExpired && !isApproved) {
            toast.error("Your 4-minute trial has expired. Join the waitlist for more access!");
            return;
        }

        isSendingRef.current = true; // Mark as sending

        // 🛡️ KILL SWITCH: Notify parent that user is sending a message (abort check-in if active)
        if (onUserTyping) {
            onUserTyping();
        }

        // 🎯 Show typing indicator IMMEDIATELY before API call
        setIsTyping(true);
        if (onSynthesizing) {
            onSynthesizing(true);
            console.log("💬 [ChatInput] Typing indicator ON - showing bubbles before AI response");
        }

        // ⏰ Start text chat trial timer when user sends first message
        if (user && !hasStartedTrialRef.current) {
            hasStartedTrialRef.current = true;
            startTextTrial(user.uid).catch((error) => {
                console.error('Error starting text trial:', error);
            });
        }

        // 🛑 Lock user timestamp NOW to prevent jumping (prevents sandwich effect)
        const userMsgTime = Date.now();
        const userMsgId = userMsgTime.toString();

        // ✅ 1. Show the CLEAN text to the User (UI with locked timestamp)
        // Optimistically add user message with explicit timestamp (show original text to user)
        const cleanUserText = text.trim();
        if (onMessageSent) {
            onMessageSent({
                id: userMsgId,
                roomId,
                personaId,
                senderType: "user",
                content: cleanUserText, // Show CLEAN text to user (no time context)
                createdAt: new Date(userMsgTime), // Locked timestamp - prevents jumping
                isSent: true,
                messageType: "text"
            });
        }

        // 🛑 CRITICAL: Save user message to DB with locked timestamp
        // This ensures the DB copy has the SAME timestamp as the local copy
        // Preventing the "sandwich" effect where DB copy appears after AI reply
        try {
            await MessageClientDb.create({
                roomId,
                personaId,
                senderType: "user",
                content: cleanUserText,
                messageType: "text",
                isSent: true,
            }, new Date(userMsgTime)); // Use the same locked timestamp
        } catch (dbError) {
            console.error("Failed to save user message to DB:", dbError);
            // Don't block the request - continue with AI call even if DB save fails
        }

        // ⏰ 2. Build HIDDEN prompt with time context (ONLY for AI, NOT displayed)
        const currentTime = new Date();
        const timeString = currentTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata' // IST
        });
        // Output: "12:30 AM" -> This matches the System Prompt's expectations.

        // 🛑 THE FIX: SAFELY GET LAST MESSAGE TIME
        // Safely extract timestamp from lastMessageTime prop
        let lastMsgTime: number | null = null;
        if (lastMessageTime) {
            if (lastMessageTime instanceof Date) {
                lastMsgTime = lastMessageTime.getTime();
            } else if (typeof lastMessageTime === 'number') {
                lastMsgTime = lastMessageTime;
            } else {
                // Try to parse as date string
                const parsed = new Date(lastMessageTime).getTime();
                lastMsgTime = isNaN(parsed) ? null : parsed;
            }
        }

        // 🛑 CHANGE: Pure Information Only. No instructions.
        // OLD/BAD: "[Current Time: 12:00 AM] [Context: It is late, ask if they are sleeping]"
        // NEW/GOOD: "[Current Time: 12:00 AM]"
        let hiddenPrompt = `[Current Time: ${timeString} IST]`;

        // Only add the "Gap" context if it's actually a gap (> 4 hours)
        if (lastMsgTime && lastMsgTime > 0) {
            const diffHours = (userMsgTime - lastMsgTime) / (1000 * 60 * 60);

            // Only add gap context if it's a real gap (> 4 hours) and reasonable (< 8000 hours = ~1 year)
            if (diffHours > 4 && diffHours < 8000) {
                hiddenPrompt += ` [System Event: User away for ${Math.floor(diffHours)} hours. You may ask where they were.]`;
            }
        }

        // Combine time context with user's text (HIDDEN from user, visible to AI only)
        hiddenPrompt += ` User said: ${cleanUserText}`;

        const aiMsgId = (userMsgTime + 1).toString();
        // Don't create placeholder - we'll create messages only after we decide format

        try {
            // ✅ Send CLEAN text for database (backend will save this)
            // ✅ Send HIDDEN prompt for AI context (backend will use this for AI generation)
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",


                },
                body: JSON.stringify({
                    text: cleanUserText, // ✅ CLEAN text for database saving
                    hiddenPrompt: hiddenPrompt, // ✅ HIDDEN prompt with time context for AI only
                    roomId,
                    personaId,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || response.statusText);
            }

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let fullBuffer = ''; // Buffer ALL chunks first
            let lineBuffer = '';

            // ⚡ OPTIMIZED: Process chunks as they arrive for faster response
            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    const chunkValue = decoder.decode(value, { stream: !done });
                    fullBuffer += chunkValue;
                    lineBuffer += chunkValue;
                    
                    // Process complete lines immediately for faster UI updates
                    const lines = lineBuffer.split('\n');
                    lineBuffer = lines.pop() || ''; // Keep incomplete line in buffer
                    
                    // Process complete SSE lines as they arrive
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || trimmedLine === 'data: [DONE]' || trimmedLine === '[DONE]') continue;
                        
                        if (trimmedLine.startsWith('data:')) {
                            const jsonStr = trimmedLine.replace(/^data:\s*/, '').trim();
                            if (jsonStr === '[DONE]' || jsonStr === '') continue;
                            
                            try {
                                    const data = JSON.parse(jsonStr);
                                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (text && typeof text === 'string' && onMessageStream) {
                                        // Stream chunks to UI immediately for faster display
                                        onMessageStream(aiMsgId, text);
                                        // ⚡ Keep typing indicator ON during streaming (don't hide it yet)
                                        // It will be hidden after the message is fully saved to DB
                                    }
                            } catch (e) {
                                // Continue processing
                            }
                        }
                    }
                }
            }

            // Process remaining buffer
            if (lineBuffer.trim()) {
                const trimmedLine = lineBuffer.trim();
                if (trimmedLine.startsWith('data:')) {
                    const jsonStr = trimmedLine.replace(/^data:\s*/, '').trim();
                    try {
                        const data = JSON.parse(jsonStr);
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text && typeof text === 'string' && onMessageStream) {
                            onMessageStream(aiMsgId, text);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }

            // 1. ANALYZE TEXT
            let text = fullBuffer.trim();

            // 🛑 FILTER: If the user didn't say "Hi", strip the AI's "Hey macha! I'm good"
            const lastUserMsg = cleanUserText.toLowerCase();
            const isGreeting = lastUserMsg.includes("hi") || lastUserMsg.includes("hello") || lastUserMsg.includes("hey");

            if (!isGreeting) {
                // Remove common robot greetings from the start of the response
                const originalText = text;

                // Pattern 1: "hey macha! im good" or "hey macha! i'm good" at the start
                text = text.replace(/^hey macha!?\s*(i'?m\s+)?good[^.]*[.?!\n]?\s*/i, "");

                // Pattern 2: "hi ra!" at the start
                text = text.replace(/^hi ra![^.]*[.?!\n]?\s*/i, "");

                // Pattern 3: "im good" or "i'm good" at the start
                text = text.replace(/^(i'?m\s+)?good[^.]*[.?!\n]?\s*/i, "");

                // Pattern 4: "hey" followed by "im good" anywhere in first line
                text = text.replace(/^hey[^.\n]*?(i'?m\s+)?good[^.]*[.?!\n]?\s*/i, "");

                // Pattern 5: "nuvvu ela unnav?" or "how are you?" as first line (common greeting follow-up)
                text = text.replace(/^(nuvvu\s+)?ela\s+unnav\?[^\n]*\n?/i, "");
                text = text.replace(/^how\s+are\s+you\?[^\n]*\n?/i, "");

                text = text.trim();

                // 🛑 SAFETY CHECK: If filtering removed everything, keep the original text
                // This ensures we always send a message, even if it contains a greeting
                if (!text || text.length === 0) {
                    console.log("⚠️ Greeting filter removed entire message, keeping original to prevent empty response");
                    text = originalText.trim();
                } else if (text !== originalText.trim()) {
                    console.log("🔪 Chopped off greeting from AI response");
                }
            }

            // Split into lines after filtering
            let rawLines = text.split('\n').filter(line => line.trim() !== "");

            // 🛑 FIX: Detect and merge incomplete questions/thoughts
            // If a line ends with a question mark but is very short (< 10 chars), 
            // it might be an incomplete question that was split incorrectly
            // Example: "kani nuvvu enti ra?" should not be split into "kani" and "nuvvu enti ra?"
            const mergedLines: string[] = [];
            for (let i = 0; i < rawLines.length; i++) {
                const currentLine = rawLines[i].trim();
                const nextLine = i + 1 < rawLines.length ? rawLines[i + 1].trim() : null;

                // If current line is very short (< 8 chars) and doesn't end with punctuation,
                // and next line exists, merge them (incomplete thought detection)
                if (currentLine.length < 8 &&
                    !currentLine.match(/[.?!]$/) &&
                    nextLine &&
                    nextLine.length > 0) {
                    mergedLines.push((currentLine + ' ' + nextLine).trim());
                    i++; // Skip next line since we merged it
                } else {
                    mergedLines.push(currentLine);
                }
            }
            rawLines = mergedLines;

            // 🛑 THE "THREAD KILLER" FILTER (Topic Jump Prevention)
            // If the user's last message was short/dry (< 15 chars), block topic-switching phrases
            const isDryReply = cleanUserText.length < 15;
            const dryReplyPatterns = ["hmm", "k", "sare", "avunu", "yess", "yesss", "yessss", "yesssss", "lol", "aha", "ok", "okay", "nice", "cool", "avunu ra", "sare ra"];
            const isDryReplyPattern = dryReplyPatterns.some(pattern => {
                const userTextLower = cleanUserText.toLowerCase().trim();
                return userTextLower === pattern || userTextLower.startsWith(pattern) || userTextLower.includes(pattern);
            });

            if (rawLines.length > 0 && (isDryReply || isDryReplyPattern)) {
                // Phrases that indicate the AI is panic-switching topics
                const threadKillers = [
                    "new updates", "updates emi", "updates em levu", "updates em levu antava",
                    "em sangathi", "kotha visheshalu", "any updates",
                    "business idea", "startup idea", "travel business",
                    "inka yess antunava", "inka yess antunav", "yess antunava", "inka yess antunnav",
                    "new updates em levu antava mari", "em sangathi mari", "travel business gurinchi",
                    "new updates em levu antava", "new updates em levu"
                ];

                // Check ALL lines for topic switches (not just the last one)
                rawLines = rawLines.filter(line => {
                    const lineLower = line.toLowerCase().trim();
                    const isTopicSwitch = threadKillers.some(trigger => lineLower.includes(trigger));

                    if (isTopicSwitch) {
                        console.log(`🔪 Chopping off Panic Topic Switch (dry reply detected):`, line);
                        return false; // Remove this line
                    }
                    return true; // Keep this line
                });
            }

            // 🛑 THE "PANIC QUESTION" BLOCKER (Deep Dive Rule)
            // If the user just gave a short emotional reply ("Kadhu", "No", "Inka ledu"),
            // BLOCK any attempt to ask "What are you doing?" or "Any plans?".
            // Note: lastUserMsg is already declared above for greeting filter, reusing it here
            const isShortEmotionalReply = lastUserMsg.length < 15 && (
                lastUserMsg.includes("kadhu") ||
                lastUserMsg.includes("no") ||
                lastUserMsg.includes("inka ledu") ||
                lastUserMsg.includes("avunu") ||
                lastUserMsg.includes("ledu")
            );

            if (rawLines.length > 0 && isShortEmotionalReply) {
                // List of "Panic Questions" that kill the vibe when user is emotional
                const vibeKillers = [
                    "em chestunnav", "em doing", "em chestunnav ippudu",
                    "plans unnaya", "em plans unnayi", "plans enti",
                    "chill chestunnava", "boring ga", "boring ga chill",
                    "lunch", "dinner", "lunch ayinda", "dinner ayinda",
                    "em sangathi", "kotha visheshalu"
                ];

                // Filter out panic questions from ALL lines
                rawLines = rawLines.filter(line => {
                    const lineLower = line.toLowerCase().trim();
                    const isVibeKiller = vibeKillers.some(trigger => lineLower.includes(trigger));

                    if (isVibeKiller) {
                        console.log(`🔪 Chopping off Panic Question (emotional reply detected):`, line);
                        return false; // Remove the bad question
                    }
                    return true; // Keep empathetic responses
                });
            }

            // 🛑 FILTER: Block unrelated topic jumps (e.g., "mana pandi kukka ra lol" after asking about name)
            // Check if any line contains completely random/unrelated phrases
            const unrelatedPhrases = [
                "pandi kukka", "pandi", "kukka", "dog", // Random animal references
                "emi chestunnav ani", "what are you doing", // Topic switches to "doing" questions
            ];

            // If user's message is about a specific topic (name, person, event), 
            // block lines that completely change topic to something unrelated
            const userMessageLower = cleanUserText.toLowerCase();
            const isAboutNameOrPerson = userMessageLower.includes("peru") ||
                userMessageLower.includes("name") ||
                userMessageLower.includes("enti") ||
                userMessageLower.includes("who");

            if (isAboutNameOrPerson && rawLines.length > 1) {
                // Filter out lines that jump to completely unrelated topics
                rawLines = rawLines.filter(line => {
                    const lineLower = line.toLowerCase();
                    const isUnrelated = unrelatedPhrases.some(phrase => lineLower.includes(phrase));
                    if (isUnrelated && !lineLower.includes("enti") && !lineLower.includes("name")) {
                        console.log(`🔪 Chopping unrelated topic jump:`, line);
                        return false;
                    }
                    return true;
                });
            }

            // 🛑 THE "ONE QUESTION" RULE
            // Allow unlimited statements/jokes/roasts, but maximum ONE question per response
            // EXCEPTION: If response is very short (<10 words) or contains exclamation, disable chopper
            const cleanLines: string[] = [];
            let questionCount = 0;
            
            // Calculate total word count of all lines to check if response is very short
            const totalWords = rawLines.join(' ').split(/\s+/).filter(w => w.length > 0).length;
            const hasExclamation = rawLines.some(line => line.includes('!'));
            const isVeryShortResponse = totalWords < 10;
            
            // DISABLE chopper for very short responses or responses with exclamations (punchy replies)
            const shouldDisableChopper = isVeryShortResponse || hasExclamation;

            // List of "Generic/Annoying" question triggers to block if they appear 2nd+
            const genericTriggers = [
                "doing", "chestunnav", "alive", "sachav", "plan", "unnau", "unnava",
                "lunch", "dinner", "sleep", "padukole", "ela unnav", "kya kar raha",
                "em plan", "plans enti", "mari plan", "what are you doing",
                "em chestunnav ippudu", "kya kar raha hai", "kya plan hai",
                "how are you", "wassup", "what's up"
            ];

            for (const line of rawLines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue; // Skip empty lines

                const isQuestion = trimmedLine.includes('?');
                const lineLower = trimmedLine.toLowerCase();
                const isGeneric = genericTriggers.some(t => lineLower.includes(t));

                if (isQuestion) {
                    questionCount++;

                    // If chopper is disabled (short/exclamatory response), allow all questions
                    if (shouldDisableChopper) {
                        cleanLines.push(trimmedLine);
                        continue;
                    }

                    // If this is the 2nd (or 3rd+) question AND it's generic -> KILL IT.
                    if (questionCount > 1 && isGeneric) {
                        console.log(`🔪 Chopping repetitive question #${questionCount}:`, trimmedLine);
                        continue; // Skip this line
                    }

                    // STRICT: Only allow ONE question per response (even if not generic)
                    if (questionCount > 1) {
                        console.log(`🔪 Chopping 2nd question (ONE QUESTION RULE):`, trimmedLine);
                        continue;
                    }
                }

                // Add the line to the valid list
                cleanLines.push(trimmedLine);
            }

            let lines = cleanLines;

            // 🛑 FINAL SAFETY CHECK: Ensure we have at least one valid line after all filtering
            // If all filters removed everything, use the filtered text as a single line
            if (lines.length === 0 && text.trim().length > 0) {
                console.log("⚠️ All filters removed content, using filtered text to prevent empty message");
                lines = [text.trim()];
            } else if (lines.length === 0) {
                // Last resort: if even the filtered text is empty, use the full buffer
                console.warn("⚠️ All content filtered out, using full buffer as fallback");
                const fallbackText = fullBuffer.trim();
                if (fallbackText.length > 0) {
                    lines = [fallbackText];
                } else {
                    // Absolute last resort: cannot send empty message
                    console.error("❌ No valid content after filtering, cannot send message");
                    setIsTyping(false);
                    if (onSynthesizing) onSynthesizing(false);
                    isSendingRef.current = false;
                    return;
                }
            }

            const isMultiLine = lines.length > 1;
            const isLongMessage = fullBuffer.length > 150; // Definition of "Intense/Advice"

            // 🛑 SPAM MODE LOGIC: Require 3+ complete thoughts (increased from 2+)
            // Check for multiple lines (3+ required for spam mode)
            const hasMultipleLines = lines.length >= 3;
            // Check if lines are complete thoughts (more lenient: 8+ chars OR ends with punctuation)
            const hasCompleteThoughts = lines.every(line =>
                line.trim().length >= 8 || line.match(/[.?!]$/) // Complete thought: either 8+ chars or ends with punctuation
            );
            const hasMultipleCompleteThoughts = hasMultipleLines && hasCompleteThoughts;

            // 2. RANDOMIZATION LOGIC (The "Vibe" Check)
            // Increased spam chance to make it actually happen
            let spamChance = 0.5; // Default: 50% chance to spam (increased from 30%)

            if (isLongMessage && hasMultipleCompleteThoughts) {
                // If it's long advice/intense AND has 2+ complete thoughts, allow even more spam
                spamChance = 0.7; // 70% chance for long messages with multiple thoughts
            }

            // 3. THE DECISION (Roll the dice)
            // Spam if we have 2+ complete lines AND the dice roll hits
            const useSpamFormat = hasMultipleCompleteThoughts && Math.random() < spamChance;
            

            // =========================================================
            // 🛑 OPTION A: SPAM MODE (Separate Bubbles)
            // =========================================================
            if (useSpamFormat) {
                console.log(`🎲 SPAM MODE: Saving ${lines.length} messages to DB (Trust the Server method)`);

                // 🛑 FIX: Add 1s buffer to start time (reduced from 2s for faster appearance)
                // This ensures AI messages are definitely "newer" than the user message you just sent.
                const baseTime = userMsgTime + 1000; // 1 second after user message (use locked timestamp)

                // Loop through lines with delays
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    // Force each bubble to be 1 second newer than the last
                    // This GUARANTEES they stay in order at the bottom
                    const explicitTime = baseTime + (i * 1000); // Base time + 1s per spam message

                    // Use setTimeout to add delay between messages
                    setTimeout(async () => {
                        // 🛑 CRITICAL CHANGE: 
                        // We REMOVED 'onMessageSent' (local bubble creation).
                        // We ONLY save to DB. The Listener in ChatInterface will handle the UI.
                        // This guarantees 1 message = 1 bubble (no duplicates possible).
                        try {
                            await MessageClientDb.create({
                                roomId,
                                personaId,
                                senderType: "persona",
                                content: line,
                                messageType: "text",
                                isSent: true,
                            }, new Date(explicitTime));
                            
                            // ⚡ Keep typing indicator ON for spam mode - it will be hidden when subscription receives the last message
                            // Don't hide it here - let the subscription handle it
                            if (i === lines.length - 1) {
                                console.log(`✅ [ChatInput] Last spam message saved, keeping typing indicator until subscription confirms`);
                            }
                        } catch (dbError) {
                            console.error("Failed to save spam message to DB:", dbError);
                            // Don't throw - continue with other messages even if one fails
                        }
                    }, i * 1200); // 1.2s delay between messages
                }
                
                // ⚡ Keep typing indicator ON during spam mode - it will be hidden when subscription receives all messages
                // Don't hide it here - let the subscription handle it

                // 🛑 CRITICAL RETURN: Stops the function here. 
                // The code below this line will NEVER run.
                return;
            }

            // =========================================================
            // 🛑 OPTION B: PARAGRAPH MODE (Single Bubble)
            // =========================================================
            console.log(`🎲 PARAGRAPH MODE: Saving 1 message to DB (Trust the Server method)`);

            // Use lines array for paragraph mode (join all lines into one)
            const normalizedContent = lines.join(' ').replace(/\s+/g, ' ').trim();
            if (normalizedContent.length > 0) {
                // 🛑 FIX: Add 1s buffer to ensure AI message is definitely "newer" than user message
                const explicitTime = userMsgTime + 1000; // 1 second after user message (use locked timestamp)

                // 🛑 CRITICAL CHANGE: 
                // We REMOVED 'onMessageSent' (local bubble creation).
                // We ONLY save to DB. The Listener in ChatInterface will handle the UI.
                // This guarantees 1 message = 1 bubble (no duplicates possible).
                try {
                    await MessageClientDb.create({
                        roomId,
                        personaId,
                        senderType: "persona",
                        content: normalizedContent,
                        messageType: "text",
                        isSent: true,
                    }, new Date(explicitTime));
                } catch (dbError) {
                    console.error("Failed to save paragraph message to DB:", dbError);
                    // Don't throw - continue even if save fails
                }
            }

        } catch (error) {
            console.error("Error sending message:", error);
            if (typeof window !== "undefined" && (window as any).toast) {
                (window as any).toast.error(
                    error instanceof Error ? error.message : "Failed to send message"
                );
            }
            // Remove the placeholder message if error? Or show error state?
            // For now keep as is.
        } finally {
            // ⚡ Keep typing indicator ON until message is fully saved to DB
            // The subscription will handle hiding it when the message appears from DB
            // Only hide if there was an error or if message saving failed
            // setIsTyping(false); // Don't hide here - let subscription handle it
            // if (onSynthesizing) onSynthesizing(false); // Don't hide here - let subscription handle it
            isSendingRef.current = false; // 🛑 Reset sending flag
        }
    };

    return (
        <div className="w-full px-2 pb-2">
            <div className="bg-background/80 rounded-2xl flex flex-row w-full h-full drop-shadow-2xl">
                <AI_Input_Search
                    handleSend={handleSend}
                    isTyping={isTyping}
                    onTyping={onUserTyping} // 🛡️ KILL SWITCH: Notify when user starts typing
                />
            </div>
        </div>
    );
}

