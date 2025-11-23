import { MicIcon, MicOffIcon, PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Toggle } from "../ui/toggle";
import ControlTray from "../audio/console/ControlTray";
import { useParams } from "next/navigation";

export default function CallInput({ roomId }: { roomId: string }) {
    return (
        <>
            <div className="w-full px-2 pb-2 flex items-center justify-center">
                <div className="bg-background/60 rounded-2xl flex flex-row drop-shadow-2xl">
                    <ControlTray roomId={roomId}></ControlTray>
                </div>
            </div>
        </>
    );
}