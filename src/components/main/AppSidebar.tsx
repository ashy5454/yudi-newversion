"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "../ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Globe2Icon, HomeIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

export default function AppSidebar() {
    const isMobile = useIsMobile();
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const isPersonaRoute = pathname?.includes("/persona") ?? false;

    const { signOut } = useAuth();

    const handleSignOut = () => {
        signOut();
        router.push("/");
    }

    const avatar = (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Avatar>
                    <AvatarImage src={user?.photoURL ?? ''} />
                    <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => router.push("/m/account")}>
                    My Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                    <Button variant="destructive" size="sm" onClick={handleSignOut}>
                        Sign Out
                    </Button>
                </DropdownMenuLabel>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="fixed bottom-0 left-0 h-16 w-screen md:h-screen md:w-16 p-0 md:p-2 z-50 border-t-2 md:border-t-0">
            <div className="bg-background/60 h-full w-full rounded-lg drop-shadow-2xl flex flex-row md:flex-col items-center justify-between">
                {/* Yudi Logo */}
                {!isMobile && (
                    <div className="flex flex-col items-center gap-2 ml-2 md:ml-0">
                        <img
                            src="/yudi.svg"
                            alt="Yudi Logo"
                            className="w-12 h-12 dark:invert"
                        />
                    </div>
                )}

                {/* Center */}
                <div className="flex flex-row md:flex-col justify-evenly md:justify-center w-full md:w-auto items-center gap-2">
                    <Button size={"icon"} variant={isPersonaRoute ? "ghost" : "secondary"} onClick={() => router.push("/m")}>
                        <HomeIcon />
                    </Button>
                    <Button size={"icon"} variant={isPersonaRoute ? "secondary" : "ghost"} onClick={() => router.push("/m/persona")}>
                        <Globe2Icon />
                    </Button>
                    {/* <Button size={"icon"} variant={"ghost"}>
                        <PlusIcon />
                    </Button> */}
                    <ThemeToggle buttonVariant={"ghost"} />
                    {isMobile && (avatar)}
                </div>

                {/* Bottom */}
                {!isMobile && (
                    <div className="flex flex-row md:flex-col items-center gap-2 mr-2 md:mr-0 md:mb-2">
                        {avatar}
                    </div>
                )}
            </div>
        </div>);
}