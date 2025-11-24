"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/firebase/firebase";
import { logEvent } from "firebase/analytics";

export default function AnalyticsListener() {
    useEffect(() => {
        // This verifies if analytics actually loaded
        if (analytics) {
            console.log("🔥 Firebase Analytics Initialized and Tracking");
            logEvent(analytics, "page_view");
        } else {
            console.log("❌ Firebase Analytics Failed to Load");
        }
    }, []);

    return null; // This component renders nothing, just runs code
}
