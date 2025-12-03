'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@/components/ui/Icons'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: 'What is ClaimStack.ai?',
    answer: 'ClaimStack.ai is a platform for structured, evidence-based debate. Users submit claims, add supporting or refuting evidence, vote on what\'s most convincing, and view AI-generated summaries of the strongest arguments on both sides.'
  },
  {
    question: 'How do I submit a claim?',
    answer: 'You can submit a claim by navigating to the \'Submit a Claim\' page. You\'ll provide a title, optional description, select a category, and may add one piece of initial evidence to support or refute the claim.'
  },
  {
    question: 'What counts as evidence?',
    answer: 'Evidence can be a news article, research paper, video, tweet, personal testimony, photo, or any verifiable source that supports or refutes a claim. Self-recorded content is allowed as long as it\'s clearly labeled.'
  },
  {
    question: 'Can I vote on more than one piece of evidence?',
    answer: 'Yes, you can vote on any piece of evidence under a claim. Each user can upvote or downvote a piece of evidence once, and votes can be changed later.'
  },
  {
    question: 'Why can\'t I post a comment?',
    answer: 'ClaimStack is intentionally designed to avoid unstructured comment threads. Instead, we focus on organizing arguments through credible evidence and AI-generated summaries.'
  },
  {
    question: 'How does the AI summary work?',
    answer: 'The AI analyzes the most upvoted evidence to generate a short summary of the leading position, along with a \'steel man\' — a fair version of the opposing view. This summary updates as new evidence is added and voted on.'
  },
  {
    question: 'What happens if someone submits false information?',
    answer: 'Users can report evidence they believe is misleading or false. Our moderation team will review reports and remove content that violates community standards or factual integrity.'
  },
  {
    question: 'Can I remain anonymous?',
    answer: 'Your profile will be visible, but you\'re not required to use your real name. Evidence submissions, votes, and claims are tied to your account, but we do not publicly display your email or personal data.'
  },
  {
    question: 'How can I follow a claim?',
    answer: 'Click the \'Follow\' button on any claim page to receive updates when new evidence is added or summaries are revised.'
  },
  {
    question: 'How do I delete my account?',
    answer: 'Go to your Account Settings and select \'Delete Account.\' This will permanently remove your personal data, but your evidence submissions may remain anonymously visible to maintain the integrity of claim threads.'
  }
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">
          Frequently Asked Questions (FAQ)
        </h1>
        
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="dark:bg-gray-800 rounded-lg overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-1 text-left flex items-center justify-between rounded-lg hover:underline"
                aria-expanded={openIndex === index}
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 pr-4">
                  {item.question}
                </h2>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

