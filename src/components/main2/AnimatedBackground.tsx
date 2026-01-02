import { Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useState, useRef } from "react";
import {
    useMotionTemplate,
    useMotionValue,
    motion,
    animate,
} from "framer-motion";
import { EN_HERO } from "@/content/en";
import * as THREE from "three";

// Parallax Stars Component
function ParallaxStars({ mouse }: { mouse: { x: number; y: number } }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.x = mouse.y * 0.15;
            groupRef.current.rotation.y = mouse.x * 0.15;
        }
    });

    return (
        <group ref={groupRef}>
            <Stars
                radius={50}
                count={2500}
                factor={4}
                fade
                speed={2}
            />
        </group>
    );
}

export default function AnimatedBackground({ className = "", showGradient = false }: { className?: string; showGradient?: boolean }) {
    const color = useMotionValue(EN_HERO.colors[0]);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (showGradient) {
            animate(color, EN_HERO.colors, {
                ease: "easeInOut",
                duration: 10,
                repeat: Infinity,
                repeatType: "mirror",
            });
        }
    }, [color, showGradient]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            mouseX.set(x);
            mouseY.set(y);
            setMousePosition({ x, y });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    // Background with deep space base and optional animated gradient overlay
    const backgroundImage = showGradient
        ? useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #0B0F19 50%, ${color})`
        : undefined;

    return (
        <div className={`absolute inset-0 z-0 ${className}`}>
            <motion.div
                className="absolute inset-0"
                style={{
                    backgroundColor: "#0B0F19",
                    ...(backgroundImage && { backgroundImage }),
                }}
            />
            <div className="absolute inset-0 z-0">
                <Canvas>
                    <ParallaxStars mouse={mousePosition} />
                </Canvas>
            </div>
        </div>
    );
}

