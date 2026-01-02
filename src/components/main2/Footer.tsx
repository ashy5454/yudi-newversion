import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { EN_FOOTER } from "@/content/en";

const Footer: React.FC = () => {
    return (
        <footer className="relative w-full bg-muted/50 pt-20 pb-12">
            <div className="mx-auto max-w-6xl pt-20 px-12 lg:px-0">
                <div className="flex flex-col lg:flex-row justify-between gap-20 lg:gap-40">
                    <div className="md:col-span-2">
                        <Logo />
                        <div className="mt-4">
                            <p className="mt-4 text-sm text-white/70">
                                {EN_FOOTER.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-row justify-between gap-40">
                        {EN_FOOTER.links.map((link, index) => (
                            <div
                                key={index}
                                className="space-y-4 text-sm">
                                <span className="block font-bold text-white">{link.group}</span>
                                {link.items.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.to}
                                        className="text-white/70 hover:text-white block duration-150">
                                        <span>{item.title}</span>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t py-6">
                    <span className="text-white/70 order-last block text-center text-sm md:order-first">© {new Date().getFullYear()}{' '}{EN_FOOTER.footerText}</span>
                    <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
                        {EN_FOOTER.socialLinks.map((icon, index) => (
                            <Link
                                key={index}
                                href={icon.to}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={icon.label}
                                className="text-white/70 hover:text-white block">
                                <svg
                                    className="size-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="1em"
                                    height="1em"
                                    viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d={icon.svgPath}></path>
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

