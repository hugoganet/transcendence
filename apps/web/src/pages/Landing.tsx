/**
 * @file Landing — Landing Page — public marketing page with feature highlights.
 * FR: Page d'Atterrissage — page marketing publique.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BookOpen, Code2, Coins, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/Button.js";
import { AnimatedCounter } from "../components/AnimatedCounter.js";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

export function Landing() {
  const { t } = useTranslation();
  const featuresRef = useScrollReveal<HTMLDivElement>();
  const statsRef = useScrollReveal<HTMLDivElement>({ delay: 200 });

  useEffect(() => {
    document.title = "Unblock.chain — Learn Blockchain by Doing";
  }, []);

  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
    })),
  );

  const features = [
    {
      icon: BookOpen,
      title: t("pages.landing.featureLearnTitle", { defaultValue: "Learn" }),
      desc: t("pages.landing.featureLearnDesc", { defaultValue: "Bite-sized missions that explain blockchain concepts with real-world analogies." }),
      color: "text-teal-500",
      bg: "bg-teal-500/10 dark:bg-teal-500/20",
    },
    {
      icon: Code2,
      title: t("pages.landing.featurePracticeTitle", { defaultValue: "Practice" }),
      desc: t("pages.landing.featurePracticeDesc", { defaultValue: "Interactive exercises that let you write, simulate, and verify on-chain logic." }),
      color: "text-amber-500",
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      icon: Coins,
      title: t("pages.landing.featureEarnTitle", { defaultValue: "Earn" }),
      desc: t("pages.landing.featureEarnDesc", { defaultValue: "Collect tokens, unlock achievements, and build your on-chain learning certificate." }),
      color: "text-green-500",
      bg: "bg-green-500/10 dark:bg-green-500/20",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-teal-50 via-white to-warm-50 dark:from-teal-900/40 dark:via-warm-900 dark:to-warm-900">
      {/* Radial accents */}
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-500/5" />
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

      {/* Hero section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="relative max-w-lg text-center">
          <div className="mb-4 flex flex-col items-center gap-4">
            <img src="/blocky-logo.svg" alt="Blocky mascot" className="h-20 w-20 rounded-xl" />
            <h1 className="text-5xl font-bold tracking-tight font-heading">
              <span className="text-primary dark:text-teal-400">Unblock</span>
              <span className="text-amber-500">.chain</span>
            </h1>
          </div>
          <p
            className="mb-8 text-lg text-gray-600 dark:text-warm-200"
            style={{ animation: "fade-in-up 0.6s ease-out 0.8s both" }}
          >
            {t("pages.landing.subtitle")}
          </p>
          <div
            className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            style={{ animation: "fade-in-up 0.6s ease-out 1.1s both" }}
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

        {/* Scroll indicator */}
        <div
          className="mt-16"
          style={{ animation: "fade-in-up 0.6s ease-out 1.6s both" }}
        >
          <ChevronDown className="h-6 w-6 animate-bounce text-gray-400 dark:text-warm-400" />
        </div>
      </section>

      {/* Features section */}
      <section className="px-4 pb-16">
        <div ref={featuresRef} className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="group rounded-2xl border border-gray-200/50 bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-warm-700/50 dark:bg-warm-800/60"
                style={{
                  animation: "stagger-in 0.5s ease-out both",
                  animationDelay: `${i * 150}ms`,
                }}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feat.bg}`}>
                  <feat.icon className={`h-6 w-6 ${feat.color}`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-warm-50">
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-warm-200">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="px-4 pb-20">
        <div ref={statsRef} className="mx-auto max-w-3xl">
          <div className="grid grid-cols-3 gap-8 rounded-2xl border border-gray-200/50 bg-white/60 p-8 backdrop-blur-sm dark:border-warm-700/50 dark:bg-warm-800/60">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary dark:text-teal-400">
                <AnimatedCounter target={50} suffix="+" />
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-warm-200">
                {t("pages.landing.statMissions", { defaultValue: "Missions" })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500 dark:text-amber-400">
                <AnimatedCounter target={4} />
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-warm-200">
                {t("pages.landing.statExerciseTypes", { defaultValue: "Exercise Types" })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 dark:text-green-400">
                <AnimatedCounter target={100} suffix="%" />
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-warm-200">
                {t("pages.landing.statFree", { defaultValue: "Free" })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <nav className="flex justify-center gap-4 pb-8 text-sm text-gray-400 dark:text-warm-300">
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
