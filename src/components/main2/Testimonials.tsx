import React from "react";
import { motion } from "framer-motion";
import { EN_TESTIMONIALS } from "@/content/en";
import AnimatedBackground from "./AnimatedBackground";

const TestimonialsColumn = (props: {
    className?: string;
    testimonials: typeof EN_TESTIMONIALS.testimonialData;
    duration?: number;
}) => {
    return (
        <div className={props.className}>
            <motion.div
                animate={{
                    translateY: "-50%",
                }}
                transition={{
                    duration: props.duration || 10,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                }}
                className="flex flex-col gap-6 pb-6 bg-background"
            >
                {[
                    ...new Array(2).fill(0).map((_, index) => (
                        <React.Fragment key={index}>
                            {props.testimonials.map(({ text, image, name, role }, i) => (
                                <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full bg-background/80 backdrop-blur-sm" key={i}>
                                    <div className="text-white">{text}</div>
                                    <div className="flex items-center gap-2 mt-5">
                                        <img
                                            width={40}
                                            height={40}
                                            src={image}
                                            alt={name}
                                            className="h-10 w-10 rounded-full"
                                        />
                                        <div className="flex flex-col">
                                            <div className="font-medium tracking-tight leading-5 text-white">{name}</div>
                                            <div className="leading-5 opacity-60 tracking-tight text-white/75">{role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </React.Fragment>
                    )),
                ]}
            </motion.div>
        </div>
    );
};

const firstColumn = EN_TESTIMONIALS.testimonialData.slice(0, 3);
const secondColumn = EN_TESTIMONIALS.testimonialData.slice(3, 6);
const thirdColumn = EN_TESTIMONIALS.testimonialData.slice(6, 9);

const Testimonials = () => {
    return (
        <section className="relative min-h-screen py-20">
            <AnimatedBackground />
            <div className="relative z-10 container mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
                >
                    <div className="flex justify-center">
                        <div className="border py-1 px-4 rounded-lg">{EN_TESTIMONIALS.badge}</div>
                    </div>

                    <h2 className="text-center text-3xl md:text-4xl lg:text-5xl tracking-tighter mt-5 text-white">
                        {EN_TESTIMONIALS.title}
                    </h2>
                    <p className="text-center mt-5 opacity-75 text-white/70">
                        {EN_TESTIMONIALS.description}
                    </p>
                </motion.div>

                <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
                </div>
            </div>
        </section>
    );
};

export default Testimonials;

