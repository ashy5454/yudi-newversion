import { EN_LOGO } from "@/content/en"
import { Link } from "react-router-dom"

export const Logo = () => {
    return (
        <Link
            to="/"
            aria-label="home"
            className="flex items-center space-x-2">
            <LogoIcon />
            <span className="hidden text-lg font-semibold lg:inline-block">{EN_LOGO.text}</span>
        </Link>
    )
}

export const LogoIcon = () => {
    return (
        <img
            src={EN_LOGO.src}
            alt={EN_LOGO.alt}
            className="h-10 w-auto md:h-20"
            width={EN_LOGO.size}
            height={EN_LOGO.size}
            loading="lazy"
            draggable="false"
        />
    )
}

