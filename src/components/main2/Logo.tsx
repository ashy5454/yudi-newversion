import Link from "next/link";
import { EN_LOGO } from "@/content/en";

export const Logo = () => {
    return (
        <Link
            href="/"
            aria-label="home"
            className="flex items-center space-x-2"
        >
            <img
                src={EN_LOGO.src}
                alt={EN_LOGO.alt}
                className={`h-${EN_LOGO.htSmall} w-auto md:h-${EN_LOGO.ht}`}
                width={EN_LOGO.size}
                height={EN_LOGO.size}
                loading="lazy"
                draggable={false}
            />
            <span className="hidden text-lg font-semibold lg:inline-block">
                {EN_LOGO.text}
            </span>
        </Link>
    );
};

