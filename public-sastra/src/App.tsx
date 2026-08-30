import { LanguageProvider } from "./i18n/LanguageContext";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { LiveInteractiveDemo } from "./components/LiveInteractiveDemo";
import { Features } from "./components/Features";
import { ModelComparison } from "./components/ModelComparison";
import { UseCases } from "./components/UseCases";
import { ArchitectureSection } from "./components/ArchitectureSection";
import { FAQSection } from "./components/FAQSection";
import { CallToAction } from "./components/CallToAction";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <LanguageProvider>
      <div className="relative min-h-screen w-full bg-[#080604] text-stone-100 font-sans selection:bg-gold/30 selection:text-gold overflow-x-hidden">
        {/* Ambient Angkor Backdrop Texture */}
        <div 
          className="fixed inset-0 bg-cover bg-center opacity-[0.03] pointer-events-none mix-blend-luminosity z-0"
          style={{ backgroundImage: "url('/images/angkor-bayon-full-bg.png')" }}
        />

        <div className="relative z-10">
          {/* Sticky Public Header */}
          <Navbar />

          {/* Hero Section with Live CTAs */}
          <Hero />

          {/* Live Interactive AI Chat Simulation Demo */}
          <LiveInteractiveDemo />

          {/* 6 Core Capability Pillars */}
          <Features />

          {/* Tri-Engine Model Comparison */}
          <ModelComparison />

          {/* Real-World Use Cases in Cambodia */}
          <UseCases />

          {/* Technical Architecture */}
          <ArchitectureSection />

          {/* Interactive FAQ */}
          <FAQSection />

          {/* Final Grand Call To Action */}
          <CallToAction />

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </LanguageProvider>
  );
}

