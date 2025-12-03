export default function PrivacyPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              This Privacy Policy explains how ClaimStack.ai collects, uses, shares, and protects your personal information. By using ClaimStack.ai, you agree to the terms of this policy. We are committed to protecting your privacy and handling your data with transparency and care.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Information We Collect</h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-3 mb-6">
              <li>
                <strong>Account Information</strong>: When you create an account, we collect your name, email address, username, and password.
              </li>
              <li>
                <strong>Content Submissions</strong>: Claims, evidence, votes, comments, profile details, and other content you contribute.
              </li>
              <li>
                <strong>Usage Data</strong>: Pages visited, browser type, device identifiers, IP address, and interactions with the platform.
              </li>
              <li>
                <strong>Cookies and Tracking Technologies</strong>: We use cookies and similar technologies to understand user behavior and improve services.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-3 mb-6">
              <li>To provide and maintain ClaimStack services</li>
              <li>To personalize and improve user experience</li>
              <li>To process submissions, votes, and generate AI summaries</li>
              <li>To communicate with you about updates, activity, or policy changes</li>
              <li>To ensure platform security and enforce our Terms of Use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal Basis for Processing (GDPR)</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you are located in the European Economic Area (EEA), our legal basis for processing your personal data depends on the information concerned and the context:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-3 mb-6">
              <li>You have given us consent (e.g., newsletter opt-in)</li>
              <li>Processing is necessary to fulfill a contract (e.g., platform access)</li>
              <li>Processing is required for our legitimate interests (e.g., service improvement)</li>
              <li>We are legally obliged to retain certain data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Rights (GDPR and Global Regulations)</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you are located in the EEA, UK, or other jurisdictions with privacy regulations, you have rights including:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-3 mb-4">
              <li>The right to access, correct, or delete your data</li>
              <li>The right to restrict or object to data processing</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent at any time</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              To exercise these rights, contact us at <a href="mailto:privacy@claimstack.ai" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@claimstack.ai</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Rights Under CCPA (California)</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you are a California resident, you have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-3 mb-4">
              <li>Know what personal information we collect and how it's used</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of the sale of personal information (Note: ClaimStack does <strong>not</strong> sell your data)</li>
              <li>Non-discrimination for exercising your privacy rights</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              To submit a CCPA request, email <a href="mailto:privacy@claimstack.ai" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@claimstack.ai</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">How We Share Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              We do not sell or rent your personal information. We may share it with service providers for platform hosting, analytics, or communication, subject to confidentiality agreements. We may also disclose data to comply with legal obligations or protect our platform and users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Data Retention</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              We retain your personal data only for as long as necessary to provide services, fulfill legal obligations, or resolve disputes. If you delete your account, we will delete your personal data within 30 days, though anonymized contributions (e.g., evidence) may remain.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">International Transfers</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              If you are accessing the platform from outside the United States, please note that your information may be transferred to and stored in servers located in the U.S. We ensure that such transfers comply with applicable data protection laws through appropriate safeguards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              We implement appropriate security measures to protect your information, including encryption and access controls. However, no internet-based service is completely secure, and we cannot guarantee absolute protection.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              ClaimStack.ai is not intended for users under the age of 13. We do not knowingly collect personal data from children. If we become aware of such data, we will take steps to delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              We may update this Privacy Policy periodically. Users will be notified of material changes via email or on the platform. Your continued use of ClaimStack.ai after changes indicates your acceptance of the revised policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              For any questions about this Privacy Policy or to exercise your rights, please contact us at <a href="mailto:privacy@claimstack.ai" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@claimstack.ai</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

