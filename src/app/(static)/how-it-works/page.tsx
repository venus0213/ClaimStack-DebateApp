export default function HowItWorksPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">How It Works</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert">

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">What Is a Claim?</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              A claim is a debatable statement that users can either agree or disagree with. For example: 'Eating breakfast is essential for a healthy diet.' Every claim on ClaimStack has two sides — For and Against — and both can be supported with evidence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">How to Participate</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Users start by choosing a side on a claim. They can then submit a piece of evidence — such as an article, video, tweet, or original content — that supports their position. Other users vote on the most persuasive pieces of evidence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">What Counts as Evidence?</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Evidence can be anything that supports or refutes a claim. It might be a peer-reviewed research paper, a news article, a social media post, or even a self-recorded video. The source and quality of the evidence matter, and the community helps surface the most credible content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Voting System</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Users can upvote or downvote each piece of evidence. Votes help signal what's most persuasive or relevant. Users can only vote once per evidence submission, but they can change their vote at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">AI Summaries and Steel Man Arguments</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              ClaimStack uses AI to automatically summarize the strongest points on each side of a debate. It also generates a 'steel man' argument — the most generous, fair version of the opposing side — to encourage deeper understanding and avoid strawman fallacies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">What Happens Next</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              As evidence is added and voted on, the AI summary updates in real time. This creates a living snapshot of the debate that evolves as new information emerges. Users can follow claims, get notified when new evidence is added, and continue contributing over time.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

