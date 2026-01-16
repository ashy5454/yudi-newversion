import { useEffect, type MouseEventHandler } from "react";
import {
    useMotionTemplate,
    useMotionValue,
    motion,
    animate,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EN_HERO } from "@/content/en";
import { FlipWords } from "@/magicui/flip-words";
import AnimatedBackground from "./AnimatedBackground";

const Hero = ({ handleEarlyAccess }: { handleEarlyAccess?: MouseEventHandler<HTMLButtonElement> }) => {
    const color = useMotionValue(EN_HERO.colors[0]);

    useEffect(() => {
        animate(color, EN_HERO.colors, {
            ease: "easeInOut",
            duration: 10,
            repeat: Infinity,
            repeatType: "mirror",
        });
    }, [color]);

    const border = useMotionTemplate`1px solid ${color}`;
    const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

    return (
        <motion.section className="relative grid min-h-screen place-content-center overflow-hidden w-full">
            <AnimatedBackground showGradient={true} />
            <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
                <h1 className="text-center font-bold leading-tight" style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(2rem, 6vw, 4.5rem)" }}>
                    <span className="text-white">{EN_HERO.titleOne}</span>
                    <span className="inline-block">
                        <FlipWords className="px-2 inline relative text-[#EC4899]" words={EN_HERO.animationTexts} />
                    </span>
                    <br />
                    <span className="text-white">{EN_HERO.titleTwo}</span>
                </h1>
                <p className="mt-6 text-white/80 text-center" style={{ fontSize: "clamp(1rem, 2vw, 1.5rem)" }}>
                    {EN_HERO.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8 items-center justify-center">
                    <motion.button
                        style={{
                            border,
                            boxShadow,
                        }}
                        whileHover={{
                            scale: 1.015,
                        }}
                        whileTap={{
                            scale: 0.985,
                        }}
                        onClick={handleEarlyAccess}
                        className="group relative flex w-fit items-center gap-1.5 rounded-full bg-gray-800/10 px-8 py-4 text-lg font-semibold text-gray-50 transition-colors hover:bg-gray-950/50"
                    >
                        {EN_HERO.cta.text}
                        <ArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
                    </motion.button>
                </div>
            </div>
        </motion.section>
    );
};

export default Hero;

