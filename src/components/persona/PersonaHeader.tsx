"use client";
import { PlusIcon, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import usePersona from "@/hooks/usePersona";

interface PersonaHeaderProps {
    onSearch?: (searchTerm: string) => void;
    onSort?: (sortBy: string) => void;
}

export default function PersonaHeader({ onSearch, onSort }: PersonaHeaderProps) {
    const router = useRouter();
    const { searchPersonas, clearPersonas, fetchPersonas } = usePersona();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");

    // Debounced search function
    const debouncedSearch = useCallback(
        (() => {
            let timeoutId: NodeJS.Timeout;
            return (value: string) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    if (value.trim()) {
                        searchPersonas(value);
                    } else {
                        fetchPersonas(8, true); // Reset to show all personas
                    }
                }, 300); // 300ms delay
            };
        })(),
        [searchPersonas, fetchPersonas]
    );

    const handleCreatePersona = () => {
        router.push("/m/persona/create");
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const handleSort = (value: string) => {
        setSortBy(value);
        if (onSort) {
            onSort(value);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4 py-4 px-2 sm:px-6 bg-background/60 border-b border-muted">

            <div className="flex flex-row items-center justify-between">
                <h1 className="text-2xl text-foreground font-sans">Persona</h1>
                <Button variant={"secondary"} size={"sm"} onClick={handleCreatePersona}>
                    <PlusIcon />
                    Create Persona
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
                <div className="flex-row items-center gap-2 hidden md:flex">
                    <Select value={sortBy} onValueChange={handleSort}>
                        <SelectTrigger className="w-32 bg-black/5 dark:bg-white/5 border-muted">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt">Latest</SelectItem>
                            <SelectItem value="usage">Sort by Usage</SelectItem>
                            <SelectItem value="rating">Sort by Rating</SelectItem>
                            <SelectItem value="name">Sort by Name</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 flex flex-row items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Search personas..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border-muted"
                    />
                    <Button onClick={() => handleSearch(searchTerm)}>
                        <Search className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}