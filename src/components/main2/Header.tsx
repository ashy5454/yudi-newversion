import { Button } from "../ui/button";
import { useState, type MouseEventHandler } from "react";
import { Logo } from "./Logo";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { EN_HEADER } from "@/content/en";

export default function Header({ handleEarlyAccess }: { handleEarlyAccess?: MouseEventHandler<HTMLButtonElement> }) {
    const [menuState, setMenuState] = useState(false);
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F19]/95 backdrop-blur-sm border-b border-white/10">
            <nav
                data-state={menuState ? 'active' : 'false'}
                className="w-full max-w-5xl mx-auto pl-4 pr-6 py-2 text-white"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Logo />
                    </div>

                    <div className="hidden lg:flex items-center gap-8 ml-16">
                        <ul className="flex gap-8 text-sm">
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
                                        className="text-white/80 hover:text-white transition-colors duration-150 cursor-pointer"
                                    >
                                        <span>{item.name}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:block">
                            <ThemeToggle />
                        </div>
                        <Button
                            onClick={handleEarlyAccess}
                            className="btn-primary border-gradient"
                        >
                            {EN_HEADER.cta.text}
                        </Button>
                        <button
                            onClick={() => setMenuState(!menuState)}
                            aria-label={menuState ? "Close Menu" : "Open Menu"}
                            className="relative z-20 block cursor-pointer p-2 lg:hidden"
                        >
                            <Menu className={`in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200 text-white ${menuState ? 'rotate-180 scale-0 opacity-0' : ''}`} />
                            <X className={`in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 text-white ${menuState ? 'rotate-0 scale-100 opacity-100' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className={`lg:hidden ${menuState ? 'block' : 'hidden'} mt-4 pb-4 border-t border-white/10 pt-4`}>
                    <ul className="space-y-4">
                        {EN_HEADER.menuItems.map((item, index) => (
                            <li key={index}>
                                <a
                                    href={item.to}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const element = document.querySelector(item.to);
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                        setMenuState(false);
                                    }}
                                    className="text-white/80 hover:text-white block duration-150 cursor-pointer"
                                >
                                    <span>{item.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4">
                        <ThemeToggle />
                    </div>
                </div>
            </nav>
        </header>
    );
}

