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

const generateSquares = () => {
  // Filter to only English, Hindi, and Telugu, then duplicate to fill 3x3 grid
  const filteredData = EN_FEATURE_THREE.squareData.filter(sq => 
    sq.id === 1 || sq.id === 2 || sq.id === 3
  );
  // Duplicate to fill 9 squares (3x3 grid)
  const duplicatedData = [...filteredData, ...filteredData, ...filteredData];
  const shuffled = shuffle([...duplicatedData]);
  return shuffled.map((sq, index) => (
    <motion.div
      key={`${sq.id}-${index}`}
      layout
      transition={{ duration: 1.5, type: "spring" }}
      className="w-full h-full rounded-md overflow-hidden bg-muted dark:opacity-80"
      style={{
        backgroundImage: `url(${sq.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    ></motion.div>
  ));
};

const ShuffleGrid = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [squares, setSquares] = useState(generateSquares());

  useEffect(() => {
    shuffleSquares();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const shuffleSquares = () => {
    setSquares(generateSquares());

    timeoutRef.current = setTimeout(shuffleSquares, 3000);
  };

  return (
    <div className="grid grid-cols-3 grid-rows-3 h-[450px] gap-1">
      {squares.map((sq) => sq)}
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

