"use client";
import { useAuth } from "@/components/AuthContext";
import { LoginButton } from "@/components/LoginButton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/m')
    }
  }, [user, loading, router])

  return (
    <>
      <LoginButton />
    </>
  );
}
