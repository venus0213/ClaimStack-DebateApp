export default function AboutPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">About ClaimStack</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert">

          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mt-8 mb-4">Our Mission</h1>     
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            ClaimStack.ai helps people make sense of controversial topics by structuring online debates with evidence. We aim to elevate public discourse by turning noisy internet arguments into organized, credible claims backed by community-vetted sources.
          </p>

          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mt-8 mb-4">Why ClaimStack Exists</h1>     
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Every day, important arguments are buried in comment sections, scattered across tweets, and lost in YouTube rabbit holes. ClaimStack provides a space where both sides of a claim can be fairly represented, supported by transparent evidence.
          </p>
          
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mt-8 mb-4">How It Works</h1>     
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Users submit a claim — a statement that can be agreed or disagreed with. They then support or refute it by submitting articles, videos, research papers, tweets, and more. The community votes on the most compelling evidence, and our AI summarizes the strongest arguments on both sides.
          </p>
          
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mt-8 mb-4">Who We Are</h1>     
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            ClaimStack was founded by a team of technologists, researchers, and designers who believe that the internet can do better. We’re committed to making public debate more intelligent, structured, and fair.
          </p>
          
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mt-8 mb-4">Contact Us</h1>     
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Have questions? Email us at support@claimstack.ai or reach out through the Contact page.
          </p>
          
        </div>
      </div>
    </div>
  )
}

