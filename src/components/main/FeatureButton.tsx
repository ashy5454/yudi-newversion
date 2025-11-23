import { PhoneIcon } from "lucide-react";
import { Button } from "../ui/button";

export default function FeatureButton({ content = "Start Call for free", onClick }: { content?: string, onClick?: () => void }) {

    return (
        <>
            <div onClick={onClick} className="relative inline-flex items-center justify-center gap-4 group">
                <div
                    className="absolute inset-0 duration-1000 opacity-60 transitiona-all bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 rounded-xl blur-lg filter group-hover:opacity-100 group-hover:duration-200"
                ></div>
                <Button variant={"outline"} size={"sm"} className="rounded-xl font-serif font-bold text-black/50 hover:text-white hover:border-white border-black/50 dark:text-white dark:hover:text-white dark:border-white bg-transparent hover:bg-transparent" >
                    <PhoneIcon />
                    {content}
                </Button>
            </div>

        </>
    );
}