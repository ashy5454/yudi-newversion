"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.email) {
        router.push("/login");
        return;
      }

      try {
        // Normalize email for consistent matching
        const emailKey = user.email.trim().toLowerCase();
        const adminRef = doc(db, "admin", emailKey);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          console.warn("Access denied: not an admin");
          await signOut(auth);
          router.push("/login");
        }
      } catch (error) {
        console.error("Error verifying admin access:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-4xl md:text-5xl font-extrabold text-purple-800 mb-4">
        Welcome to Your Dashboard
      </h1>
      <p className="text-lg text-gray-600 max-w-xl">
        This is your space to track progress, get insights, and vibe with your
        learning journey ✨
      </p>
      <div className="mt-10 p-6 rounded-2xl shadow-xl bg-white">
        <p className="text-gray-800">More features coming soon...</p>
      </div>
    </main>
  );
}
