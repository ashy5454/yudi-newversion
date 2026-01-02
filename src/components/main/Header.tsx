import { Button } from "../ui/button";
import { useState, type MouseEventHandler } from "react";
import { Logo } from "./Logo";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { EN_HEADER } from "@/content/en";

export default function Header({ handleEarlyAccess }: { handleEarlyAccess: MouseEventHandler<HTMLButtonElement> | undefined }) {
    const [menuState, setMenuState] = useState(false)
    return (
        <header
            className="fixed top-5 left-0 right-0 z-30 px-4"
        >
            <nav
                data-state={menuState && 'active'}
                className="border border-white/10 rounded-2xl bg-white/10 dark:bg-background/10 backdrop-blur-xl backdrop-saturate-150 shadow-lg shadow-black/5 dark:shadow-black/20 w-full max-w-6xl mx-auto">
                <div className="px-6">
                    <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Logo />
                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="bg-white/10 dark:bg-background/10 backdrop-blur-xl backdrop-saturate-150 in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-white/10 p-6 shadow-2xl shadow-black/5 dark:shadow-black/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:lg:bg-transparent">
                            <div className="lg:pr-4">
                                <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-sm">
                                    {EN_HEADER.menuItems.map((item, index) => (
                                        <li key={index}>
                                            <a
                                                href={item.to}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const element = document.querySelector(item.to);
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    } else if (item.to === '#about') {
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }
                                                    setMenuState(false);
                                                }}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150 cursor-pointer">
                                                <span>{item.name}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:pl-6">
                                <ThemeToggle />

                                <Button
                                    asChild
                                    onClick={handleEarlyAccess}
                                    size="sm">
                                    <span>{EN_HEADER.cta.text}</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}

