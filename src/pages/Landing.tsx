"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useEffect, useState } from "react";
import Faqs from "@/components/main2/Faqs";
import FeatureOne from "@/components/main2/FeatureOne";
import FeatureThree from "@/components/main2/FeatureThree";
import Footer from "@/components/main2/Footer";
import Header from "@/components/main2/Header";
import Hero from "@/components/main2/Hero";
import Testimonials from "@/components/main2/Testimonials";
import { RoomClientDb } from "@/lib/firebase/clientDb";
import { PersonaClientDb } from "@/lib/firebase/clientDb";

export default function Landing() {
    const router = useRouter();
    const { user, loading, signInWithGoogle } = useAuth();
    const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
    const [checkingFirstTime, setCheckingFirstTime] = useState(true);

    // Check if user is first-time or returning
    useEffect(() => {
        const checkUserStatus = async () => {
            if (loading) return;
            
            if (user) {
                // User is logged in - check if they have any rooms or personas
                try {
                    const [rooms, personas] = await Promise.all([
                        RoomClientDb.getByUserId(user.uid),
                        PersonaClientDb.getByCreator(user.uid)
                    ]);
                    
                    // If user has rooms or personas, they are returning - skip landing page
                    if (rooms.length > 0 || personas.length > 0) {
                        setIsFirstTime(false);
                        router.push('/m'); // Redirect to personas list
                    } else {
                        setIsFirstTime(true); // First-time user - show landing page
                    }
                } catch (error) {
                    console.error('Error checking user status:', error);
                    setIsFirstTime(true); // On error, show landing page
                } finally {
                    setCheckingFirstTime(false);
                }
            } else {
                // User not logged in - show landing page
                setIsFirstTime(true);
                setCheckingFirstTime(false);
            }
        };

        checkUserStatus();
    }, [user, loading, router]);

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

    // Show loading state while checking
    if (checkingFirstTime) {
        return (
            <div className="dark w-full min-h-screen bg-[#0B0F19] flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    // If returning user, don't render landing page (they should be redirected)
    if (!isFirstTime) {
        return null;
    }

    return (
        <div className="dark w-full min-h-screen bg-[#0B0F19]">
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

