import type { Metadata } from 'next'
import SupportContent from './SupportContent'

export const metadata: Metadata = {
  title: 'Support — Groundswell',
  description: 'Get help with Groundswell surf forecasting.',
  openGraph: { title: 'Support — Groundswell', type: 'website' },
  twitter: { card: 'summary', title: 'Support — Groundswell' },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I contact Groundswell?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Email support@groundswell.surf. We typically respond within 1–2 business days. For urgent issues (account access, billing errors), include "URGENT" in the subject line.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I cancel or manage my Groundswell subscription?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sign in and click "Manage Billing" in the account menu. This opens your Stripe billing portal where you can cancel, upgrade, or update your subscription directly.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why does my local surf forecast look different from actual conditions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Groundswell uses the Open-Meteo NEMO marine model, updated hourly. Very localized conditions — reef breaks, harbors, river mouths — can differ from open-ocean model output. You can review data sources and live accuracy stats on the Accuracy page.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I request a refund?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'See the Refund & Cancellation Policy at groundswell.surf/refund, or email support@groundswell.surf.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I request a copy of my data or deletion under GDPR?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Email support@groundswell.surf with the subject "Data Request." See the Privacy Policy at groundswell.surf/privacy for full details on your rights.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I report a bug or request a feature?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Email support@groundswell.surf. We read and consider every suggestion from surfers.',
      },
    },
  ],
}

export default function SupportPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SupportContent />
    </>
  )
}
