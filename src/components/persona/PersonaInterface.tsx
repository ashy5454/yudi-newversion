"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import PersonaHeader from "./PersonaHeader";
import PersonaCard from "./PersonaCard";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import usePersona from "@/hooks/usePersona";
import { useEffect, useState, useMemo } from "react";
import { Persona } from "@/lib/firebase/dbTypes";

export default function PersonaInterface() {
    const isMobile = useIsMobile();
    const { personas, fetchPersonas, loading, error } = usePersona();
    const [sortBy, setSortBy] = useState("createdAt");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Fetch personas on mount - always fetch on first render
        if (mounted && !loading && personas.length === 0) {
            console.log('Fetching personas...');
            fetchPersonas(100, true).catch(err => {
                console.error('Error fetching personas:', err);
            });
        }
    }, [mounted, loading]); // Only depend on mounted and loading

    // Sort personas based on the selected sort option
    const sortedPersonas = useMemo(() => {
        const sorted = [...personas];

        switch (sortBy) {
            case "usage":
                return sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
            case "rating":
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case "name":
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case "createdAt":
            default:
                return sorted.sort((a, b) => {
                    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
                    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
                    return dateB.getTime() - dateA.getTime();
                });
        }
    }, [personas, sortBy]);

    const handleSort = (sortOption: string) => {
        setSortBy(sortOption);
    };

    // Loading skeleton
    const renderSkeletons = () => {
        return Array.from({ length: 8 }).map((_, index) => (
            <div
                key={index}
                className="min-w-[200px] max-xs flex-1"
                style={{ flexBasis: "300px" }}
            >
                <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
        ));
    };

    // Error state
    if (error) {
        return (
            <div className="fixed top-0 left-16 w-[calc(100vw-96px)] h-screen py-2 flex items-center justify-center">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Personas</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => fetchPersonas(100, true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {isMobile ? (
                <div className="fixed top-0 left-0 right-0 w-full py-2">
                    <PersonaHeader onSort={handleSort} />
                    {/* Chat List */}
                    <ScrollArea className="h-[calc(100vh-270px)] overflow-hidden">
                        <div className="flex flex-col justify-center items-center gap-2 pt-2">
                            {loading && sortedPersonas.length === 0 ? (
                                renderSkeletons()
                            ) : sortedPersonas.length === 0 ? (
                                <div className="text-center text-muted-foreground p-8">
                                    <p className="mb-4">No personas found.</p>
                                    <button
                                        onClick={() => fetchPersonas(100, true)}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            ) : (
                                sortedPersonas.map((persona) => (
                                    <div
                                        key={persona.id}
                                        className="max-w-[calc(100vw-64px)] w-max flex-1"
                                        style={{ flexBasis: "250px" }}
                                    >
                                        <PersonaCard personaId={persona.id} persona={persona} />
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            ) : (
                <div className="fixed top-0 left-16 w-[calc(100vw-96px)] h-screen py-2">
                    <PersonaHeader onSort={handleSort} />
                    {/* Chat List */}
                    <ScrollArea className="h-[calc(100vh-180px)] overflow-auto bg-transparent">
                        <div className="flex flex-wrap justify-center items-start gap-2 pt-2">
                            {loading && sortedPersonas.length === 0 ? (
                                renderSkeletons()
                            ) : sortedPersonas.length === 0 ? (
                                <div className="text-center text-muted-foreground p-8">
                                    <p className="mb-4">No personas found.</p>
                                    <button
                                        onClick={() => fetchPersonas(100, true)}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            ) : (
                                sortedPersonas.map((persona) => (
                                    <div
                                        key={persona.id}
                                        className="min-w-[200px] max-xs flex-1"
                                        style={{ flexBasis: "300px" }}
                                    >
                                        <PersonaCard personaId={persona.id} persona={persona} />
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </>
    );
}