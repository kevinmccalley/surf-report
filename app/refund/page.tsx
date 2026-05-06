import type { Metadata } from 'next'
import LegalPage from '@/app/components/LegalPage'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Groundswell',
  description: 'Groundswell refund and cancellation policy for monthly and annual subscriptions.',
}

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      subtitle="Simple, fair, and no questions asked."
      lastUpdated="May 6, 2026"
      sections={[
        {
          heading: 'Cancellation',
          body: (
            <>
              <p>You may cancel your Groundswell subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period — you retain full access to the Service until then.</p>
              <p>To cancel, sign in at <strong className="text-white">groundswell.surf</strong>, click your account menu, and select "Manage Billing." This opens your Stripe billing portal where you can cancel with one click. No hoops, no retention flows.</p>
            </>
          ),
        },
        {
          heading: 'EU 14-Day Cooling-Off Period',
          body: (
            <>
              <p>Under the EU Consumer Rights Directive, if you are a consumer resident in the European Union, you have the right to withdraw from a subscription contract within <strong className="text-white">14 days</strong> of your initial purchase without giving any reason.</p>
              <p>To exercise this right, email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> within 14 days of subscribing with the subject line "Cancellation Request." We will issue a full refund within 14 days of receiving your request.</p>
              <p>Please note: if you explicitly request that the Service begins immediately (before the 14-day period expires) and then withdraw, you may be charged a proportional amount for the days of use.</p>
            </>
          ),
        },
        {
          heading: 'Refunds — Monthly Subscriptions',
          body: (
            <>
              <p>Monthly subscription fees are generally non-refundable once a billing period has begun. However, if you contact us within <strong className="text-white">7 days</strong> of a charge and have not made substantial use of the Service during that period, we will review your request and issue a refund at our discretion.</p>
              <p>We want you to be happy with Groundswell. If the forecast data is not meeting your expectations for your region, tell us — we may be able to help or issue a courtesy refund.</p>
            </>
          ),
        },
        {
          heading: 'Refunds — Annual Subscriptions',
          body: (
            <p>If you subscribed annually and wish to cancel within the first <strong className="text-white">30 days</strong>, contact us for a pro-rated refund for the unused portion of your subscription. After 30 days, annual subscriptions are non-refundable but you retain access for the full paid period.</p>
          ),
        },
        {
          heading: 'Service Outages',
          body: (
            <p>If Groundswell experiences a significant service outage lasting more than 24 consecutive hours, affected subscribers may request a credit for the affected period. We will issue credits proactively for any outage exceeding 48 hours.</p>
          ),
        },
        {
          heading: 'How to Request a Refund',
          body: (
            <p>Email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> with your account email address and the reason for your request. We respond within 2 business days. Approved refunds are returned to your original payment method within 5–10 business days, depending on your bank.</p>
          ),
        },
        {
          heading: 'Free Trial',
          body: (
            <p>If a free trial is offered, it will not be charged until the trial period ends. You may cancel at any time during the trial with no charge. No refund is applicable for a trial period as no payment is taken.</p>
          ),
        },
      ]}
    />
  )
}
