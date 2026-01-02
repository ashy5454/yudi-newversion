import { useEffect, type MouseEventHandler } from "react";
import {
  useMotionTemplate,
  useMotionValue,
  motion,
  animate,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EN_HERO } from "@/content/en";
import { FlipWords } from "../magicui/flip-words";
import AnimatedBackground from "./AnimatedBackground";

const Hero = ({ handleEarlyAccess }: { handleEarlyAccess: MouseEventHandler<HTMLButtonElement> | undefined }) => {
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
    <motion.section
      className="relative grid md:min-h-screen place-content-center overflow-hidden lg:pt-48 lg:pb-32 md:pt-24 pt-32 pb-10"
    >
      <AnimatedBackground showGradient={true} />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="lg:max-w-3xl max-w-[80vw] text-center lg:text-7xl font-semibold leading-tight text-5xl sm:leading-tight md:text-6xl md:leading-tight" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
          <span className="text-white">{EN_HERO.titleOne}</span>
          <span className="bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
            <FlipWords color={color} className={`text-5xl  md:text-6xl inline relative lg:text-7xl`} words={EN_HERO.animationTexts} />
          </span>
          <br />
          <span className="bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">{EN_HERO.titleTwo}</span>
        </h1>
        <p className="my-6 lg:max-w-xl max-w-[80vw] text-white/60 text-center text-xl leading-relaxed md:text-2xl md:leading-relaxed">
          {EN_HERO.description}
        </p>
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
    </motion.section >
  );
};

export default Hero;

