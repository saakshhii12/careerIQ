import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import { ChatProvider, ChatPanel, ChatbotWidget } from "@/features/chatbot";

export default function Home() {
  return (
    <ChatProvider>
      <SiteHeader />

      <main>
        <Hero />

        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
          <ChatPanel />
        </section>
      </main>

      <ChatbotWidget />
    </ChatProvider>
  );
}
