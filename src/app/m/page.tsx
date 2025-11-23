import AppBackground from "@/components/main/AppBackground";
import AppList from "@/components/main/AppList";
import AppSidebar from "@/components/main/AppSidebar";
import Link from "next/link";

export default function Page() {
    return (
        <>
            <AppBackground>
                <AppSidebar />
                <AppList />
                <div className="hidden md:flex fixed top-0 bottom-0 left-80 right-0 text-center flex-col gap-6 items-center justify-center">
                    <h1 className="text-4xl">Pick a persona to chat</h1>
                    <Link
                        href={"/m/persona"}
                        className="h-9 px-4 py-2 has-[>svg]:px-3 bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 btn-primary border-gradient cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                    >
                        Explore Personas
                    </Link>
                </div>
            </AppBackground>
        </>
    );
}