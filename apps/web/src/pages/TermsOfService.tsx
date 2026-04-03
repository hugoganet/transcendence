import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function TermsOfService() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("pages.termsOfService.title")} — Unblock.chain`;
  }, [t]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="mb-6 inline-block text-primary underline hover:text-primary/70">
        &larr; {t("pages.termsOfService.backToHome")}
      </Link>

      <h1 className="mb-6 text-3xl font-bold">{t("pages.termsOfService.title")}</h1>
      <p className="mb-8 text-sm text-gray-500">{t("pages.termsOfService.lastUpdated")}</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s1Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s1Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s2Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s2Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s3Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s3Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s4Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s4Intro")}
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
          <li>{t("pages.termsOfService.s4Item1")}</li>
          <li>{t("pages.termsOfService.s4Item2")}</li>
          <li>{t("pages.termsOfService.s4Item3")}</li>
          <li>{t("pages.termsOfService.s4Item4")}</li>
          <li>{t("pages.termsOfService.s4Item5")}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s5Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s5Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s6Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s6Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s7Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s7Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s8Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s8Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s9Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s9Body")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">{t("pages.termsOfService.s10Title")}</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          {t("pages.termsOfService.s10Body")}
        </p>
      </section>
    </main>
  );
}
