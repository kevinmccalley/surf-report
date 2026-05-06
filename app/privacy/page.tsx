import type { Metadata } from 'next'
import LegalPage from '@/app/components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy | Groundswell',
  description: 'Privacy Policy for Groundswell surf forecasting. GDPR-compliant.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="We collect only what we need and never sell your data."
      lastUpdated="May 6, 2026"
      sections={[
        {
          heading: '1. Who We Are',
          body: (
            <>
              <p>Groundswell (groundswell.surf) is operated by Kevin McCalley, Portugal. For all privacy-related matters, including data subject requests, contact us at <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
              <p>We are the data controller for personal data collected through this Service. This policy explains what data we collect, why, how it is used, and your rights under the EU General Data Protection Regulation (GDPR) and applicable Portuguese data protection law.</p>
            </>
          ),
        },
        {
          heading: '2. Data We Collect',
          body: (
            <>
              <p><strong className="text-white">Account data:</strong> When you register, we collect your email address and any profile information you provide. Account authentication is handled by Clerk, Inc.</p>
              <p><strong className="text-white">Payment data:</strong> Billing information (card details, billing address) is collected and stored exclusively by Stripe, Inc. We do not store your full card number or CVV on our servers.</p>
              <p><strong className="text-white">Usage data:</strong> We collect anonymized analytics (page views, feature usage) through Vercel Analytics to improve the Service. No personal identifiers are included.</p>
              <p><strong className="text-white">Location data:</strong> When you search for a surf location, that location is used to fetch forecast data. We do not persistently store your search history or link it to your account identity.</p>
              <p><strong className="text-white">Technical data:</strong> Standard server logs (IP address, browser type, request timestamps) are retained for up to 30 days for security and debugging purposes.</p>
            </>
          ),
        },
        {
          heading: '3. Why We Process Your Data (Legal Basis)',
          body: (
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li><strong className="text-white">Contract performance:</strong> Account and payment data are processed to provide and bill for the Service.</li>
              <li><strong className="text-white">Legitimate interests:</strong> Usage analytics and server logs are processed to maintain security and improve the Service.</li>
              <li><strong className="text-white">Legal obligation:</strong> We retain certain transaction records as required by Portuguese and EU tax law.</li>
            </ul>
          ),
        },
        {
          heading: '4. Third-Party Processors',
          body: (
            <>
              <p>We share data with the following processors, each bound by appropriate data processing agreements:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li><strong className="text-white">Clerk, Inc.</strong> — authentication and account management (US, EU Standard Contractual Clauses apply)</li>
                <li><strong className="text-white">Stripe, Inc.</strong> — payment processing (US/EU, PCI-DSS compliant)</li>
                <li><strong className="text-white">Vercel, Inc.</strong> — hosting, deployment, and analytics (US, EU SCCs apply)</li>
                <li><strong className="text-white">Redis Ltd.</strong> — short-term caching of non-personal forecast results (US)</li>
              </ul>
              <p className="mt-3">We do not sell, rent, or share your personal data with any third party for marketing purposes.</p>
            </>
          ),
        },
        {
          heading: '5. Data Retention',
          body: (
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Account data: retained for the duration of your subscription plus 12 months, then deleted on request.</li>
              <li>Payment records: retained for 7 years as required by EU tax law.</li>
              <li>Server logs: deleted after 30 days.</li>
              <li>Cached forecast data: automatically expires within 6 hours, contains no personal identifiers.</li>
            </ul>
          ),
        },
        {
          heading: '6. Your Rights Under GDPR',
          body: (
            <>
              <p>As a data subject in the EU/EEA, you have the following rights, which you may exercise at any time by contacting us:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li><strong className="text-white">Access:</strong> request a copy of all personal data we hold about you.</li>
                <li><strong className="text-white">Rectification:</strong> request correction of inaccurate data.</li>
                <li><strong className="text-white">Erasure:</strong> request deletion of your data ("right to be forgotten"), subject to legal retention obligations.</li>
                <li><strong className="text-white">Restriction:</strong> request that we limit processing of your data in certain circumstances.</li>
                <li><strong className="text-white">Portability:</strong> receive your data in a structured, machine-readable format.</li>
                <li><strong className="text-white">Object:</strong> object to processing based on legitimate interests.</li>
                <li><strong className="text-white">Withdraw consent:</strong> where processing is based on consent, you may withdraw it at any time.</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>. We will respond within 30 days.</p>
            </>
          ),
        },
        {
          heading: '7. Right to Lodge a Complaint',
          body: (
            <p>If you believe we have not handled your data lawfully, you have the right to lodge a complaint with the Portuguese data protection supervisory authority: <strong className="text-white">Comissão Nacional de Proteção de Dados (CNPD)</strong>, Av. D. Carlos I, 134 — 1º, 1200-651 Lisboa, Portugal. Website: <span className="text-slate-300">cnpd.pt</span>.</p>
          ),
        },
        {
          heading: '8. Cookies',
          body: (
            <>
              <p>We use only strictly necessary cookies for authentication session management (via Clerk). We do not use advertising, tracking, or third-party marketing cookies. No cookie consent banner is required as we do not use non-essential cookies.</p>
            </>
          ),
        },
        {
          heading: '9. International Transfers',
          body: (
            <p>Some of our processors are located in the United States. Where personal data is transferred outside the EU/EEA, we ensure appropriate safeguards are in place, including the use of EU Standard Contractual Clauses (SCCs) as approved by the European Commission.</p>
          ),
        },
        {
          heading: '10. Changes to This Policy',
          body: (
            <p>We may update this policy from time to time. We will notify you of material changes by email. The current version is always available at groundswell.surf/privacy.</p>
          ),
        },
      ]}
    />
  )
}
