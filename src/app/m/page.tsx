"use client";
import AppBackground from "@/components/main/AppBackground";
import AppList from "@/components/main/AppList";
import AppSidebar from "@/components/main/AppSidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();

    const handleCreatePersona = () => {
        router.push("/m/persona/create");
    };

    return (
        <>
            <AppBackground>
                <AppSidebar />
                <AppList />
                <div className="hidden md:flex fixed top-0 bottom-0 left-80 right-0 text-center flex-col gap-6 items-center justify-center">
                    <Link href={"/m/persona"}>
                        <Button
                            variant="secondary"
                            size="default"
                            className="h-11 px-6 text-base"
                        >
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Explore Personas
                        </Button>
                    </Link>
                    <Button
                        variant="secondary"
                        size="default"
                        onClick={handleCreatePersona}
                        className="h-11 px-6 text-base"
                    >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create Persona
                    </Button>
                </div>
            </AppBackground>
        </>
    );
}