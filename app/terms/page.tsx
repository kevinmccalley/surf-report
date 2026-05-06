import type { Metadata } from 'next'
import LegalPage from '@/app/components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service | Groundswell',
  description: 'Terms of Service for Groundswell surf forecasting.',
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Groundswell."
      lastUpdated="May 6, 2026"
      sections={[
        {
          heading: '1. Acceptance of Terms',
          body: (
            <>
              <p>By accessing or using Groundswell at groundswell.surf (the "Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service.</p>
              <p>The Service is operated by Kevin McCalley ("we," "us," or "our"). These terms are governed by the laws of Portugal and applicable European Union regulations.</p>
            </>
          ),
        },
        {
          heading: '2. Description of Service',
          body: (
            <>
              <p>Groundswell provides real-time surf reports, wave forecasts, tide predictions, and related oceanographic data for locations worldwide. Forecast data is sourced from third-party open data providers including Open-Meteo and NOAA.</p>
              <p>Forecasts are provided for informational purposes only. Surf and ocean conditions can change rapidly and without warning. You are solely responsible for assessing whether conditions are safe before entering the water.</p>
              <p><strong className="text-white">The Service is not a safety tool.</strong> Never rely solely on this application when making decisions about ocean activities. Always consult multiple sources, local authorities, and use your own judgment.</p>
            </>
          ),
        },
        {
          heading: '3. Accounts and Subscriptions',
          body: (
            <>
              <p>Access to full Service features requires a paid subscription. Subscriptions are billed on a monthly or annual basis. You must provide accurate account information when registering.</p>
              <p>You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorized use of your account.</p>
              <p>We reserve the right to suspend or terminate accounts that violate these terms or are used in a manner that harms the Service or other users.</p>
            </>
          ),
        },
        {
          heading: '4. Payment',
          body: (
            <>
              <p>Payments are processed by Stripe, Inc. By providing payment information, you authorize us to charge the applicable subscription fee to your payment method on a recurring basis until you cancel.</p>
              <p>All prices are in US dollars (USD) and are exclusive of any applicable taxes, which may be added based on your location. For EU-based subscribers, applicable VAT will be calculated at checkout.</p>
              <p>We reserve the right to change subscription pricing with 30 days' advance notice. Continued use of the Service after a price change constitutes acceptance of the new price.</p>
            </>
          ),
        },
        {
          heading: '5. Cancellation and Refunds',
          body: (
            <p>You may cancel your subscription at any time. See our <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Refund and Cancellation Policy</a> for full details, including EU cooling-off rights.</p>
          ),
        },
        {
          heading: '6. Intellectual Property',
          body: (
            <>
              <p>The Groundswell name, logo, application design, and original content are the exclusive property of Kevin McCalley. All rights are reserved.</p>
              <p>Underlying forecast data is sourced from open-data providers under their respective open licenses and is not claimed as proprietary. See our <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Data Sources</a> page for attribution.</p>
              <p>You may not scrape, reproduce, redistribute, or create derivative works from the Service without our prior written consent.</p>
            </>
          ),
        },
        {
          heading: '7. Disclaimer of Warranties',
          body: (
            <>
              <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or accuracy of forecast data.</p>
              <p>We do not warrant that the Service will be uninterrupted, error-free, or that any forecasts will be accurate for any specific location or time.</p>
            </>
          ),
        },
        {
          heading: '8. Limitation of Liability',
          body: (
            <p>To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to personal injury, property damage, or financial loss arising from use of the Service or reliance on forecast data. Our total liability to you for any claim shall not exceed the amount paid by you for the Service in the three months preceding the claim.</p>
          ),
        },
        {
          heading: '9. Privacy',
          body: (
            <p>Your use of the Service is also governed by our <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>
          ),
        },
        {
          heading: '10. Changes to Terms',
          body: (
            <p>We may update these Terms from time to time. We will notify you of material changes by email or by prominently posting a notice on the Service. Continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Terms.</p>
          ),
        },
        {
          heading: '11. Contact',
          body: (
            <p>Questions about these Terms? Contact us at <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">our support page</a> or email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
          ),
        },
      ]}
    />
  )
}
