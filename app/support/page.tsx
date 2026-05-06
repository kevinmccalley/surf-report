import type { Metadata } from 'next'
import LegalPage from '@/app/components/LegalPage'

export const metadata: Metadata = {
  title: 'Support | Groundswell',
  description: 'Get help with Groundswell surf forecasting.',
}

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      subtitle="We're a small team and we read every message."
      lastUpdated="May 6, 2026"
      sections={[
        {
          heading: 'Contact Us',
          body: (
            <>
              <p>The fastest way to reach us is by email:</p>
              <p className="mt-2">
                <a
                  href="mailto:support@groundswell.surf"
                  className="text-sky-400 hover:text-sky-300 transition-colors text-base font-medium"
                >
                  support@groundswell.surf
                </a>
              </p>
              <p className="mt-3 text-slate-400">We typically respond within 1–2 business days. For urgent issues (account access, billing errors), please include "URGENT" in the subject line.</p>
            </>
          ),
        },
        {
          heading: 'Billing & Subscriptions',
          body: (
            <>
              <p>To cancel, upgrade, or change your subscription, sign in and click "Manage Billing" in the account menu. This opens your Stripe billing portal where you can manage everything directly.</p>
              <p>For refund requests, see our <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Refund & Cancellation Policy</a>. To request a refund, email us at <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
            </>
          ),
        },
        {
          heading: 'Forecast Questions',
          body: (
            <>
              <p>Groundswell uses open, verified data sources for all forecasts. If a forecast looks wrong for your local spot, here are a few things to know:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li>Wave data comes from the Open-Meteo NEMO marine model, updated hourly.</li>
                <li>Tide predictions come from NOAA CO-OPS and other official harmonic databases.</li>
                <li>Very localized conditions (reef breaks, harbors, river mouths) may differ from open-ocean model output.</li>
              </ul>
              <p className="mt-3">You can review our data sources and live accuracy statistics on the <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Accuracy page</a>.</p>
            </>
          ),
        },
        {
          heading: 'Privacy & Data Requests',
          body: (
            <p>To request a copy of your data, ask for deletion, or exercise any other GDPR right, email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> with the subject "Data Request." See our <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Privacy Policy</a> for full details on your rights.</p>
          ),
        },
        {
          heading: 'Feature Requests & Bug Reports',
          body: (
            <p>We love hearing from surfers. If something is broken or you have an idea for a new feature, send us an email at <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>. We read and consider every suggestion.</p>
          ),
        },
        {
          heading: 'Business & Press Inquiries',
          body: (
            <p>For partnership, licensing, or press inquiries, email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> with "Business Inquiry" in the subject line.</p>
          ),
        },
      ]}
    />
  )
}
