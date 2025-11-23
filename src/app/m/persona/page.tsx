import AppBackground from "@/components/main/AppBackground";
import AppSidebar from "@/components/main/AppSidebar";
import PersonaInterface from "@/components/persona/PersonaInterface";

export default function PersonaPage() {
    return (
        <>
            <AppBackground>
                <AppSidebar />
                <PersonaInterface />
            </AppBackground>
        </>
    );
}