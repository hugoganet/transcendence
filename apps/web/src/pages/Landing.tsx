import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { LanguageSwitcher } from "../components/LanguageSwitcher.js";
import { AnimatedText } from "../components/AnimatedText.js";

export function Landing() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Unblock.chain — Learn Blockchain by Doing";
  }, []);

  // Generate floating particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 5,
  }));

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-teal-50 via-white to-warm-50 px-4 dark:from-teal-900/40 dark:via-warm-900 dark:to-warm-900">
      {/* Radial accent top */}
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-500/5" />
      {/* Radial accent bottom */}
      <div className="absolute bottom-0 right-1/4 h-[300px] w-[600px] rounded-full bg-amber-400/5 blur-3xl dark:bg-amber-500/3" />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-teal-400/20 dark:bg-teal-400/10"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animation: `float-particle ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Top bar */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher variant="pill" />
      </div>

      <div className="relative max-w-lg text-center">
        <AnimatedText
          text="Unblock.chain"
          className="mb-4 text-5xl font-bold tracking-tight text-primary font-heading dark:text-teal-400"
          delayMs={50}
        />
        <p
          className="mb-8 text-lg text-gray-600 dark:text-warm-200"
          style={{
            animation: "fade-in-up 0.6s ease-out 0.8s both",
          }}
        >
          {t("pages.landing.subtitle")}
        </p>
        <div
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          style={{
            animation: "fade-in-up 0.6s ease-out 1.1s both",
          }}
        >
          <Link to="/register">
            <Button className="shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200">
              {t("pages.landing.getStarted")}
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" className="hover:-translate-y-0.5 transition-all duration-200">
              {t("pages.landing.signIn")}
            </Button>
          </Link>
        </div>
      </div>
      <nav
        className="mt-12 flex gap-4 text-sm text-gray-400 dark:text-warm-200"
        style={{
          animation: "fade-in-up 0.6s ease-out 1.4s both",
        }}
      >
        <Link to="/privacy-policy" className="transition-colors hover:text-primary">
          {t("pages.landing.privacyPolicy")}
        </Link>
        <Link to="/terms-of-service" className="transition-colors hover:text-primary">
          {t("pages.landing.termsOfService")}
        </Link>
      </nav>
    </div>
  );
}
