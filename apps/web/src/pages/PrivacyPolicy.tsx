import { useEffect } from "react";
import { Link } from "react-router-dom";

export function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy — Transcendence";
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="mb-6 inline-block text-primary underline hover:text-primary/70">
        &larr; Back to home
      </Link>

      <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated: March 7, 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">1. Introduction</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          Welcome to Transcendence. We are committed to protecting your personal data and your right
          to privacy. This Privacy Policy explains how we collect, use, store, and share your
          information when you use our blockchain education platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">2. Data We Collect</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          We collect the following types of information:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
          <li>
            <strong>Account information:</strong> email address, display name, and password (hashed).
          </li>
          <li>
            <strong>Learning progress:</strong> completed missions, exercise submissions, XP earned,
            and knowledge token balances.
          </li>
          <li>
            <strong>Usage data:</strong> pages visited, session duration, and feature interactions.
          </li>
          <li>
            <strong>Technical data:</strong> browser type, device information, and IP address.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">3. How We Use Your Data</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          We use your data to:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
          <li>Provide and maintain our blockchain education service.</li>
          <li>Track your learning progress and personalize your experience.</li>
          <li>Manage your account and authenticate your sessions.</li>
          <li>Send notifications about your learning streaks and achievements.</li>
          <li>Improve our platform based on usage patterns.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">4. Data Storage & Security</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          Your data is stored in secure PostgreSQL databases. Sessions are managed via Redis with
          server-side session storage. All communications are encrypted using HTTPS/TLS. We implement
          industry-standard security measures including rate limiting, CSRF protection, and secure
          cookie handling.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">5. Cookies & Sessions</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          Transcendence uses session cookies to maintain your authenticated state. These cookies are
          essential for the platform to function and are not used for advertising or tracking
          purposes. Session data is stored server-side in Redis and is automatically deleted when
          your session expires.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">6. Third-Party Sharing</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          We do not sell, trade, or otherwise share your personal data with third parties, except:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
          <li>When required by law or legal process.</li>
          <li>
            With service providers who assist in operating our platform (e.g., email delivery),
            under strict data processing agreements.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">7. Your Rights (GDPR)</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          Under the General Data Protection Regulation (GDPR), you have the right to:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
          <li>
            <strong>Access:</strong> Request a copy of the personal data we hold about you.
          </li>
          <li>
            <strong>Export:</strong> Download your data in a portable format.
          </li>
          <li>
            <strong>Rectification:</strong> Request correction of inaccurate data.
          </li>
          <li>
            <strong>Deletion:</strong> Request permanent deletion of your account and all associated
            data.
          </li>
          <li>
            <strong>Restriction:</strong> Request that we limit how we process your data.
          </li>
          <li>
            <strong>Objection:</strong> Object to certain types of data processing.
          </li>
        </ul>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          To exercise any of these rights, please use the account settings in the platform or
          contact us at the address below.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">8. Data Retention</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          We retain your personal data for as long as your account is active. If you request account
          deletion, all personal data will be permanently removed within 30 days. Anonymized usage
          statistics may be retained for platform improvement purposes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">9. Contact Information</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700">
          If you have questions about this Privacy Policy or wish to exercise your data rights,
          please contact us at:{" "}
          <a href="mailto:privacy@transcendence.app" className="text-primary underline">
            privacy@transcendence.app
          </a>
        </p>
      </section>
    </main>
  );
}
