/**
 * @file PrivacyPolicy — Privacy Policy — GDPR-compliant privacy policy page.
 * FR: Politique de Confidentialite — page conforme RGPD.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function PrivacyPolicy() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("pages.privacyPolicy.title")} — Unblock.chain`;
  }, [t]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-[var(--color-text)]">
      <Link to="/" className="mb-6 inline-block text-primary underline hover:text-primary/70">
        &larr; {t("pages.privacyPolicy.backToHome")}
      </Link>

      <h1 className="mb-6 text-3xl font-bold text-[var(--color-text)] font-heading">{t("pages.privacyPolicy.title")}</h1>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">{t("pages.privacyPolicy.lastUpdated")}</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.privacyPolicy.s1Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s1Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.privacyPolicy.s2Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s2Intro")}
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-[var(--color-text)]">
          <li>{t("pages.privacyPolicy.s2Item1")}</li>
          <li>{t("pages.privacyPolicy.s2Item2")}</li>
          <li>{t("pages.privacyPolicy.s2Item3")}</li>
          <li>{t("pages.privacyPolicy.s2Item4")}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.privacyPolicy.s3Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s3Intro")}
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-[var(--color-text)]">
          <li>{t("pages.privacyPolicy.s3Item1")}</li>
          <li>{t("pages.privacyPolicy.s3Item2")}</li>
          <li>{t("pages.privacyPolicy.s3Item3")}</li>
          <li>{t("pages.privacyPolicy.s3Item4")}</li>
          <li>{t("pages.privacyPolicy.s3Item5")}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.privacyPolicy.s4Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s4Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.privacyPolicy.s5Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s5Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.privacyPolicy.s6Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s6Intro")}
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-[var(--color-text)]">
          <li>{t("pages.privacyPolicy.s6Item1")}</li>
          <li>{t("pages.privacyPolicy.s6Item2")}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.privacyPolicy.s7Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s7Intro")}
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-[var(--color-text)]">
          <li>{t("pages.privacyPolicy.s7Item1")}</li>
          <li>{t("pages.privacyPolicy.s7Item2")}</li>
          <li>{t("pages.privacyPolicy.s7Item3")}</li>
          <li>{t("pages.privacyPolicy.s7Item4")}</li>
          <li>{t("pages.privacyPolicy.s7Item5")}</li>
          <li>{t("pages.privacyPolicy.s7Item6")}</li>
        </ul>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s7Outro")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.privacyPolicy.s8Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s8Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.privacyPolicy.s9Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-[var(--color-text)]">
          {t("pages.privacyPolicy.s9Body")}{" "}
          <a href="mailto:privacy@transcendence.app" className="text-primary underline">
            privacy@transcendence.app
          </a>
        </p>
      </section>
    </main>
  );
}
