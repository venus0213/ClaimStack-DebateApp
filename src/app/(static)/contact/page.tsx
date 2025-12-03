export default function ContactPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">Contact Us</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert">

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Support & Technical Issues</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              If you're having trouble using ClaimStack.ai or encountering a bug, please email us at <a href="mailto:support@claimstack.ai" className="text-blue-600 dark:text-blue-400 hover:underline">support@claimstack.ai</a> with a detailed description of the issue.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Privacy & Data Requests</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              For privacy-related inquiries or to exercise your data rights under laws like GDPR or CCPA, contact us at <a href="mailto:privacy@claimstack.ai" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@claimstack.ai</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal Inquiries</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              If you are contacting us regarding legal matters, terms of use, or content disputes, please reach out to <a href="mailto:legal@claimstack.ai" className="text-blue-600 dark:text-blue-400 hover:underline">legal@claimstack.ai</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">General Feedback & Ideas</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              We're always looking to improve. If you have suggestions or want to share how you use ClaimStack.ai, email us at <a href="mailto:hello@claimstack.ai" className="text-blue-600 dark:text-blue-400 hover:underline">hello@claimstack.ai</a> or connect on social media.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Media & Press</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              For media inquiries, please contact <a href="mailto:press@claimstack.ai" className="text-blue-600 dark:text-blue-400 hover:underline">press@claimstack.ai</a>. We're happy to provide interviews, demos, or share the story behind ClaimStack.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Social Media</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              You can find us on Twitter/X at <a href="https://twitter.com/ClaimStackAI" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">@ClaimStackAI</a>. Tag us with claims or content you'd like to submit or debate.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

