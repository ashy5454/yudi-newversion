"use client";

import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error("No email found for this user.");
      }

      // Normalize email (remove spaces + lowercase)
      const emailKey = user.email.trim().toLowerCase();
      console.log("Signed in as:", emailKey);

      // Firestore: admin collection, doc ID is the normalized email
      const adminRef = doc(db, "admin", emailKey);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        // ✅ User is an admin
        router.push("/dashboard");
      } else {
        // ❌ Not in admin list
        console.warn("Access denied: not an admin");
        await signOut(auth);
        alert("You are not authorized to access this app.");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <button
        onClick={handleGoogleLogin}
        className="bg-black text-white px-6 py-3 rounded-xl text-lg hover:scale-105 transition-all"
      >
        Sign in with Google
      </button>
    </div>
  );
}
