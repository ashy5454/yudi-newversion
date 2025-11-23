"use client";
import KeynoteCompanion from "../audio/actor/keynote-companion/KeynoteCompanion";
import ErrorScreen from "../audio/actor/ErrorSreen";
import { Persona } from "@/lib/firebase";

export default function CallWindow({ persona }: { persona: Persona }) {
    return (
        <>
            <div className="flex-1 h-2/3 w-full p-2 flex items-center justify-center">
                <div className="bg-background/60">
                    <ErrorScreen />
                    <div className="flex items-center justify-between">
                        <KeynoteCompanion persona={persona} />
                    </div>
                </div>
            </div>
        </>
    );
}