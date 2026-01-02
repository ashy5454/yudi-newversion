"use client";

import { cn } from "@/lib/utils";

interface ProgressiveBlurProps {
  className?: string;
  direction?: "left" | "right" | "top" | "bottom";
  blurIntensity?: number;
}

export function ProgressiveBlur({
  className,
  direction = "left",
  blurIntensity = 1,
}: ProgressiveBlurProps) {
  const gradients = {
    left: "linear-gradient(to right, transparent, rgba(0,0,0,0.5))",
    right: "linear-gradient(to left, transparent, rgba(0,0,0,0.5))",
    top: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))",
    bottom: "linear-gradient(to top, transparent, rgba(0,0,0,0.5))",
  };

  return (
    <div
      className={cn("pointer-events-none", className)}
      style={{
        background: gradients[direction],
        filter: `blur(${blurIntensity * 4}px)`,
      }}
    />
  );
}

