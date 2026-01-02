import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { EN_FEATURE_ONE } from "@/content/en"
import AnimatedBackground from "./AnimatedBackground"

interface Feature {
  step: string
  title?: string
  content: string
  image: string
}

interface FeatureStepsProps {
  features: Feature[]
  className?: string
  title?: string
  autoPlayInterval?: number
  imageHeight?: string
}

function FeatureSteps({
  features,
  className,
  title = "Feature Steps",
  autoPlayInterval = 3000,
  imageHeight = "h-[400px]",
}: FeatureStepsProps) {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (autoPlayInterval / 100))
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length)
        setProgress(0)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [progress, features.length, autoPlayInterval])

  return (
    <div className={cn("w-full", className)}>
      <div className="max-w-6xl mx-auto w-full px-6 md:px-12 lg:px-20 py-12 md:py-16 lg:py-20">
        <h2 className="text-4xl md:text-5xl lg:text-6xl mb-12 md:mb-16 text-center text-white font-bold">
          {title}
        </h2>

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12 lg:gap-16">
          <div className="w-full lg:w-1/2 space-y-8 md:space-y-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-4 md:gap-6"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.4 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 flex-shrink-0",
                    index === currentFeature
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-gray-700/50 border-gray-600 text-white/70",
                  )}
                >
                  {index === currentFeature ? (
                    <span className="text-lg md:text-xl font-bold">✓</span>
                  ) : (
                    <span className="text-base md:text-lg font-semibold">{index + 1}</span>
                  )}
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
                    {feature.title || feature.step}
                  </h3>
                  <p className="text-sm md:text-base lg:text-lg text-white/70 leading-relaxed whitespace-pre-line">
                    {feature.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="w-full lg:w-1/2 flex items-center justify-center h-[300px] md:h-[400px] lg:h-[450px]">
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="w-full h-full flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.step}
                        className="h-auto w-auto max-h-full max-w-full object-contain"
                      />
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeatureOne() {
  return (
    <div className="relative w-full min-h-screen flex items-center">
      <AnimatedBackground />
      <div className="relative z-10 w-full">
        <FeatureSteps
          features={EN_FEATURE_ONE.features}
          title={EN_FEATURE_ONE.title}
          autoPlayInterval={EN_FEATURE_ONE.autoPlayInterval}
          imageHeight={EN_FEATURE_ONE.imageHeight}
        />
      </div>
    </div>
  )
}