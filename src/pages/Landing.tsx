"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import Faqs from "@/components/main2/Faqs";
import FeatureOne from "@/components/main2/FeatureOne";
import FeatureThree from "@/components/main2/FeatureThree";
import Footer from "@/components/main2/Footer";
import Header from "@/components/main2/Header";
import Hero from "@/components/main2/Hero";
import Testimonials from "@/components/main2/Testimonials";

export default function Landing() {
    const router = useRouter();
    const { user, loading, signInWithGoogle } = useAuth();

    const handleEarlyAccess = async () => {
        if (loading) {
            return; // Don't do anything while loading
        }

        if (user) {
            // User is logged in, redirect to main app
            router.push('/m');
        } else {
            // User is not logged in, trigger Google sign in
            try {
                await signInWithGoogle();
                // After successful login, redirect to main app
                // Small delay to ensure auth state is updated
                setTimeout(() => {
                    router.push('/m');
                }, 500);
            } catch (error) {
                console.error('Sign in error:', error);
            }
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#0B0F19]">
            <Header handleEarlyAccess={handleEarlyAccess} />

            <main className="w-full">
                <section id="about" className="w-full min-h-screen">
                    <Hero handleEarlyAccess={handleEarlyAccess} />
                </section>

                <section id="features" className="w-full min-h-screen">
                    <FeatureOne />
                </section>

                <section id="languages" className="w-full min-h-screen">
                    <FeatureThree handleEarlyAccess={handleEarlyAccess} />
                </section>

                <section className="w-full min-h-screen">
                    <Testimonials />
                </section>

                <section id="contact" className="w-full min-h-screen pb-32">
                    <Faqs />
                </section>
            </main>

            <Footer />
        </div>
    );
}
// It tells the build server: "Skip building this page statically, just wait for a real user."
export async function getServerSideProps() {
    return {
        props: {},
    };
}

