"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
export default function AI_Input_Search({ handleSend, isTyping, onTyping }: { handleSend: (s: string) => void, isTyping?: boolean, onTyping?: () => void }) {
    const [value, setValue] = useState("");
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 52,
        maxHeight: 100,
    });
    // const [showSearch, setShowSearch] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = () => {
        const textToSend = value.trim();
        if (!textToSend) return; // Don't send empty messages

        setValue("");
        adjustHeight(true);
        handleSend(textToSend);
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleContainerClick = () => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    return (
        <div className="w-full">
            <div className="relative w-full mx-auto">
                <div
                    role="textbox"
                    tabIndex={0}
                    aria-label="Search input container"
                    className={cn(
                        "relative flex flex-col rounded-xl transition-all duration-200 w-full text-left cursor-text",
                        "ring-1 ring-black/10 dark:ring-white/10",
                        isFocused && "ring-black/20 dark:ring-white/20"
                    )}
                    onClick={handleContainerClick}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            handleContainerClick();
                        }
                    }}
                >
                    <div className="relative overflow-y-auto max-h-[200px]">
                        {/* ✅ Send button positioned at top-right of textarea (stays visible above keyboard on mobile) */}
                        <div className="absolute right-2 top-2 z-10">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!value.trim() || isTyping}
                                className={cn(
                                    "rounded-lg p-2 transition-colors shadow-sm",
                                    value.trim() && !isTyping
                                        ? "bg-sky-500/20 text-sky-500 hover:bg-sky-500/30 active:bg-sky-500/40"
                                        : "bg-black/10 dark:bg-white/10 text-black/30 dark:text-white/30 cursor-not-allowed"
                                )}
                            >
                                <Send className={cn("w-4 h-4", isTyping && "opacity-50")} />
                            </button>
                        </div>
                        <Textarea
                            id="ai-input-04"
                            enterKeyHint="send"
                            value={value}
                            placeholder="Type a message..."
                            className="w-full rounded-xl rounded-b-none px-4 py-3 pr-12 bg-black/5 dark:bg-white/5 border-none dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 leading-[1.2]"
                            ref={textareaRef}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                                // 🛡️ KILL SWITCH: Notify parent when user starts typing
                                if (e.target.value.trim().length > 0 && onTyping) {
                                    onTyping();
                                }
                            }}
                        />
                    </div>

                    <div className="h-12 bg-black/5 dark:bg-white/5 rounded-b-xl">
                        <div className="absolute left-3 bottom-3 flex items-center gap-2">
                            {/* <label className="cursor-pointer rounded-lg p-2 bg-black/5 dark:bg-white/5">
                                <input type="file" className="hidden" />
                                <Paperclip className="w-4 h-4 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors" />
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSearch(!showSearch);
                                }}
                                className={cn(
                                    "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8 cursor-pointer",
                                    showSearch
                                        ? "bg-sky-500/15 border-sky-400 text-sky-500"
                                        : "bg-black/5 dark:bg-white/5 border-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white "
                                )}
                            >
                                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                    <motion.div
                                        animate={{
                                            rotate: showSearch ? 180 : 0,
                                            scale: showSearch ? 1.1 : 1,
                                        }}
                                        whileHover={{
                                            rotate: showSearch ? 180 : 15,
                                            scale: 1.1,
                                            transition: {
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 10,
                                            },
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 25,
                                        }}
                                    >
                                        <Globe
                                            className={cn(
                                                "w-4 h-4",
                                                showSearch
                                                    ? "text-sky-500"
                                                    : "text-inherit"
                                            )}
                                        />
                                    </motion.div>
                                </div>
                                <AnimatePresence>
                                    {showSearch && (
                                        <motion.span
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{
                                                width: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ width: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-sm overflow-hidden whitespace-nowrap text-sky-500 shrink-0"
                                        >
                                            Search
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
