"use client";

import AppBackground from "@/components/main/AppBackground";
import AppSidebar from "@/components/main/AppSidebar";
import CreatePersona from "@/components/persona/CreatePersona";

export default function PersonaCreatePage() {
    return (
        <AppBackground>
            <AppSidebar />
            <CreatePersona />
        </AppBackground>
    );
}