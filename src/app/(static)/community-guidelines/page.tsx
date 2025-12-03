export default function CommunityGuidelinesPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">Community Guidelines</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert">

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Purpose of These Guidelines</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              These community guidelines exist to maintain a respectful, evidence-driven environment where users can engage in meaningful debate and help surface the strongest arguments from both sides of an issue.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Respectful Participation</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Treat all users with respect, even if you disagree with them. Personal attacks, hate speech, harassment, and trolling will not be tolerated. Focus on the evidence, not the individual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Evidence Standards</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Only submit evidence that supports or refutes a claim. Evidence must be relevant, and ideally verifiable. Submissions with misinformation, manipulated content, or low-effort spam may be removed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Prohibited Content</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Do not submit or link to content that is:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
              <li>Hateful or discriminatory</li>
              <li>Violent or threatening</li>
              <li>Pornographic or sexually explicit</li>
              <li>Intentionally misleading or deceptive</li>
              <li>Private or confidential (e.g., doxxing)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Self-Sourced Evidence</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              You may submit original content, such as photos, videos, or screenshots that you personally captured or created. When doing so, be transparent about context and avoid misrepresenting what is shown.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Reporting and Moderation</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              If you see content that violates these guidelines, report it using the flag icon. Our moderators will review reports and may remove content or suspend users who break the rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Appeals and Accountability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Users who feel their content was removed unfairly may submit an appeal. ClaimStack aims to moderate transparently and improve its processes through community feedback.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Our Values</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              ClaimStack is built on the belief that structured, fair, and evidence-based debate strengthens public understanding. We welcome diverse viewpoints, but expect every contribution to uphold our core values of clarity, credibility, and civility.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

