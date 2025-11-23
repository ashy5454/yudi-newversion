import { useState } from "react";
import { SearchIcon, TelescopeIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppHeaderProps {
    onSearch?: (searchTerm: string) => void;
}

export default function AppHeader({ onSearch }: AppHeaderProps) {
    const isMobile = useIsMobile();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        onSearch?.(value);
    };

    const handleSearchClick = () => {
        onSearch?.(searchTerm);
    };

    return (
        <>
            {/* Chat List Header */}
            <div className="flex flex-col justify-between bg-background/60 rounded-lg drop-shadow-2xl p-2 mx-2 md:mx-0">
                {/* Logo Name */}
                <div className="flex flex-row justify-between">
                    <div className="text-foreground text-3xl md:text-4xl font-bold font-sans flex flex-row items-center">
                        {isMobile && (
                            <img
                                src="/yudi.svg"
                                alt="Yudi Logo"
                                className="w-8 h-8 dark:invert mr-2"
                            />
                        )}
                        YUDI
                    </div>
                    {/* <Button variant="ghost" size={"icon"}>
                        <TelescopeIcon />
                    </Button> */}
                </div>

                {/* Search Box */}
                <div className="w-full mt-2">
                    <div className="flex flex-row gap-2">
                        <Input
                            id="search"
                            placeholder="Search Chats"
                            className="w-full bg-black/5 dark:bg-white/5 border-muted"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearchClick();
                                }
                            }}
                        />
                        <Button
                            variant="secondary"
                            size={"icon"}
                            onClick={handleSearchClick}
                        >
                            <SearchIcon />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}