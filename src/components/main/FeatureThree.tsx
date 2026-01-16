import { motion } from "framer-motion";
import { useEffect, useRef, useState, type MouseEventHandler } from "react";
import { EN_FEATURE_THREE } from "@/content/en";
import AnimatedBackground from "./AnimatedBackground";

const ShuffleHero = ({ handleEarlyAccess }: { handleEarlyAccess: MouseEventHandler<HTMLButtonElement> | undefined }) => {
  return (
    <section className="w-full px-8 py-12 grid grid-cols-1 md:grid-cols-2 items-center gap-8 max-w-6xl mx-auto">
      <div>
        <span className="block mb-4 text-xs md:text-sm text-primary font-medium">
          {EN_FEATURE_THREE.badge}
        </span>
        <h3 className="text-3xl md:text-4xl lg:text-5xl text-foreground">
          {EN_FEATURE_THREE.title}
        </h3>
        <p className="text-base md:text-lg text-muted-foreground my-4 md:my-6">
          {EN_FEATURE_THREE.description}
        </p>
      </div>
      <ShuffleGrid />
    </section>
  );
};

const shuffle = (array: (typeof EN_FEATURE_THREE.squareData)[0][]) => {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const ShuffleGrid = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the 3 languages: English, Hindi, Telugu
  const allLanguages = EN_FEATURE_THREE.squareData.filter(sq => 
    sq.id === 1 || sq.id === 2 || sq.id === 3
  );
  
  // State to hold shuffled language data (not JSX)
  const [shuffledLanguages, setShuffledLanguages] = useState(() => shuffle([...allLanguages]));

  useEffect(() => {
    shuffleLanguages();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const shuffleLanguages = () => {
    setShuffledLanguages(shuffle([...allLanguages]));
    timeoutRef.current = setTimeout(shuffleLanguages, 3000);
  };

  // Triangle/Pyramid formation: 1 block on top, 2 blocks on bottom
  return (
    <div className="flex flex-col items-center justify-center h-[450px] gap-4">
      {/* Top block (single) */}
      <motion.div
        key={`top-${shuffledLanguages[0]?.id}-${Date.now()}`}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, type: "spring" }}
        className="w-32 h-32 md:w-40 md:h-40 rounded-md overflow-hidden bg-muted dark:opacity-80 shadow-lg"
        style={{
          backgroundImage: `url(${shuffledLanguages[0]?.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></motion.div>
      
      {/* Bottom row (2 blocks) */}
      <div className="flex gap-4">
        <motion.div
          key={`bottom-left-${shuffledLanguages[1]?.id}-${Date.now()}`}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, type: "spring", delay: 0.1 }}
          className="w-32 h-32 md:w-40 md:h-40 rounded-md overflow-hidden bg-muted dark:opacity-80 shadow-lg"
          style={{
            backgroundImage: `url(${shuffledLanguages[1]?.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></motion.div>
        <motion.div
          key={`bottom-right-${shuffledLanguages[2]?.id}-${Date.now()}`}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, type: "spring", delay: 0.2 }}
          className="w-32 h-32 md:w-40 md:h-40 rounded-md overflow-hidden bg-muted dark:opacity-80 shadow-lg"
          style={{
            backgroundImage: `url(${shuffledLanguages[2]?.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></motion.div>
      </div>
    </div>
  );
};

const FeatureThree = ({ handleEarlyAccess }: { handleEarlyAccess: MouseEventHandler<HTMLButtonElement> | undefined }) => {
  return (
    <div className="relative flex w-full min-h-screen justify-center items-center">
      <AnimatedBackground />
      <div className="relative z-10 w-full">
        <ShuffleHero handleEarlyAccess={handleEarlyAccess} />
      </div>
    </div>
  );
};

export default FeatureThree;

