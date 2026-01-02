"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InfiniteSliderProps {
  children: ReactNode;
  speed?: number;
  speedOnHover?: number;
  gap?: number;
  className?: string;
}

export function InfiniteSlider({
  children,
  speed = 40,
  speedOnHover,
  gap = 16,
  className,
}: InfiniteSliderProps) {
  return (
    <div
      className={cn(
        "flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black,transparent)]",
        className
      )}
    >
      <div
        className="flex animate-infinite-scroll items-center justify-center gap-4"
        style={
          {
            "--speed": `${speed}s`,
            "--speed-on-hover": speedOnHover ? `${speedOnHover}s` : undefined,
            "--gap": `${gap}px`,
          } as React.CSSProperties
        }
      >
        {children}
        {children}
      </div>
    </div>
  );
}

