import ChatInterface from "@/components/chat/ChatInterface";
import AppBackground from "@/components/main/AppBackground";
import AppList from "@/components/main/AppList";
import AppSidebar from "@/components/main/AppSidebar";

export default function ChatPage() {
  return (
    <>
      <AppBackground>
        <div className="hidden md:block">
          <AppSidebar />
          <AppList />
        </div>
        <ChatInterface />
      </AppBackground>
    </>
  );
}