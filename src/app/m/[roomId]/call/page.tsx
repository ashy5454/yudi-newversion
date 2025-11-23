import CallInterface from "@/components/call/CallInterface";
import AppBackground from "@/components/main/AppBackground";
import AppList from "@/components/main/AppList";
import AppSidebar from "@/components/main/AppSidebar";
import { LiveAPIProvider } from "@/components/audio/LiveAPIContext";

export const dynamic = "force-dynamic";

export default function CallPage() {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in CallPage");
  } else {
    console.log(`GEMINI_API_KEY found in CallPage (length: ${apiKey.length})`);
  }

  return (
    <>
      <AppBackground>
        <div className="hidden md:block">
          <AppSidebar />
          <AppList />
        </div>
        <LiveAPIProvider apiKey={apiKey}>
          <CallInterface />
        </LiveAPIProvider>
      </AppBackground>
    </>
  );
}