import { useEffect } from "react";
import { Link } from "react-router-dom";

export function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service — Transcendence";
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="mb-6 inline-block text-primary underline hover:text-primary/70">
        &larr; Back to home
      </Link>

      <h1 className="mb-6 text-3xl font-bold">Terms of Service</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated: March 7, 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">1. Acceptance of Terms</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          By accessing or using Transcendence, you agree to be bound by these Terms of Service. If
          you do not agree to these terms, you may not use the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">2. Description of Service</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          Transcendence is an educational platform designed to teach blockchain concepts to
          non-technical adults through bite-sized, gamified lessons. The platform uses simulated
          tokens, gas fees, and wallets for educational purposes only. No real cryptocurrency,
          tokens, or digital assets of monetary value are involved.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">3. User Accounts</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          To use Transcendence, you must create an account. You must be at least 16 years of age to
          create an account. You are responsible for maintaining the confidentiality of your account
          credentials and for all activities that occur under your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">4. Acceptable Use</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          You agree to use Transcendence only for its intended educational purposes. You may not:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
          <li>Attempt to gain unauthorized access to other accounts or platform systems.</li>
          <li>Use the platform to distribute harmful, offensive, or illegal content.</li>
          <li>Interfere with or disrupt the platform or its infrastructure.</li>
          <li>Use automated tools to access the platform without permission.</li>
          <li>Misrepresent your identity or impersonate another user.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">5. Educational Content Disclaimer</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          All content on Transcendence is provided for educational purposes only and does not
          constitute financial, investment, or legal advice. The simulated tokens, gas fees, and
          wallet mechanics on this platform are learning tools and have no real-world monetary value.
          Always consult a qualified professional before making financial decisions related to
          blockchain or cryptocurrency.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">6. Intellectual Property</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          All content, design, code, and educational materials on Transcendence are the property of
          the Transcendence team or its licensors. You may not reproduce, distribute, or create
          derivative works from our content without explicit permission.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">7. Limitation of Liability</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          Transcendence is provided &quot;as is&quot; without warranties of any kind. We are not
          liable for any indirect, incidental, or consequential damages arising from your use of the
          platform. Our total liability shall not exceed the amount you have paid to use the service,
          if any.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">8. Termination</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          We reserve the right to suspend or terminate your account if you violate these Terms of
          Service. You may delete your account at any time through the platform settings. Upon
          account deletion, your personal data will be handled according to our Privacy Policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">9. Governing Law</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          These Terms of Service are governed by and construed in accordance with the laws of the
          European Union. Any disputes arising under these terms shall be subject to the exclusive
          jurisdiction of the competent courts.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">10. Changes to Terms</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          We may update these Terms of Service from time to time. We will notify registered users of
          significant changes via email or platform notification. Continued use of the platform
          after changes constitutes acceptance of the updated terms.
        </p>
      </section>
    </main>
  );
}
