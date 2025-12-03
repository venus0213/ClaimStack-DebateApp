export default function TermsPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              By using ClaimStack.ai, you agree to be bound by these Terms of Use, our Privacy Policy, and all applicable laws and regulations. If you do not agree with any part of these terms, please do not use the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">User Eligibility</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              You must be at least 13 years old to use ClaimStack.ai. By creating an account, you confirm that you meet this age requirement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Responsibilities</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">User Content</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You retain ownership of any content you submit to ClaimStack.ai (claims, evidence, profile details, etc.), but you grant us a non-exclusive, royalty-free, worldwide license to use, display, and distribute your content on our platform.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              You agree not to upload or submit any content that is unlawful, harmful, abusive, harassing, defamatory, or violates the rights of others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Platform Usage Guidelines</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You agree to use ClaimStack.ai only for lawful purposes and in accordance with our Community Guidelines. You may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
              <li>Attempt to interfere with the platform's operation</li>
              <li>Access user data without authorization</li>
              <li>Use bots, scrapers, or other automated means to extract data</li>
              <li>Post spam, propaganda, or impersonate others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Moderation and Content Removal</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              ClaimStack.ai reserves the right to remove any content or suspend accounts that violate our guidelines or pose a risk to the integrity of the platform. We are not obligated to review all content but may take action at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              All content and features on ClaimStack.ai (excluding user-submitted content) are owned by ClaimStack.ai and protected by copyright, trademark, and other intellectual property laws. You may not copy, reproduce, or distribute any part of the site without our permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Disclaimer of Warranties</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              ClaimStack.ai is provided 'as is' without warranties of any kind, either express or implied. We do not guarantee the accuracy or reliability of any content submitted by users or generated by AI features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              To the fullest extent permitted by law, ClaimStack.ai shall not be liable for any damages arising from your use of the platform, including direct, indirect, incidental, or consequential damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Indemnification</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              You agree to indemnify and hold harmless ClaimStack.ai, its team, and affiliates from any claims, damages, or losses resulting from your use of the platform or violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Changes to These Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              We may modify these Terms of Use at any time. We will notify users of significant changes via email or platform notices. Your continued use of the platform after changes are posted constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              These terms are governed by the laws of the United States and the state of New York. Any legal disputes shall be resolved in the appropriate courts located in New York.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              If you have questions about these Terms of Use, contact us at <a href="mailto:legal@claimstack.ai" className="text-blue-600 dark:text-blue-400 hover:underline">legal@claimstack.ai</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

