'use client'

import LegalPage from '@/app/components/LegalPage'
import { useLanguage } from '@/app/i18n/LanguageContext'

function getContent(locale: string) {
  switch (locale) {
    case 'pt-PT':
    case 'pt-BR':
      return {
        title: 'Política de Reembolso e Cancelamento',
        subtitle: 'Simples, justa e sem perguntas.',
        lastUpdated: '6 de maio de 2026',
        sections: [
          {
            heading: 'Cancelamento',
            body: <>
              <p>Pode cancelar a sua subscrição do Groundswell a qualquer momento nas definições da sua conta. O cancelamento entra em vigor no final do período de faturação atual — mantém acesso total ao Serviço até essa data.</p>
              <p>Para cancelar, inicie sessão em <strong className="text-white">groundswell.surf</strong>, clique no menu da sua conta e selecione "Gerir Faturação". Isso abre o portal de faturação Stripe onde pode cancelar com um clique. Sem complicações, sem fluxos de retenção.</p>
            </>,
          },
          {
            heading: 'Período de Desistência de 14 Dias (UE)',
            body: <>
              <p>Ao abrigo da Diretiva dos Direitos dos Consumidores da UE, se for um consumidor residente na União Europeia, tem o direito de desistir de um contrato de subscrição no prazo de <strong className="text-white">14 dias</strong> após a sua compra inicial, sem dar qualquer razão.</p>
              <p>Para exercer este direito, envie um e-mail para <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> no prazo de 14 dias após a subscrição com o assunto "Pedido de Cancelamento". Emitiremos um reembolso total no prazo de 14 dias após recebermos o seu pedido.</p>
              <p>Nota: se solicitar expressamente que o Serviço comece imediatamente (antes de o período de 14 dias expirar) e depois desistir, poderá ser cobrado um valor proporcional pelos dias de utilização.</p>
            </>,
          },
          {
            heading: 'Reembolsos — Subscrições Mensais',
            body: <>
              <p>As taxas de subscrição mensal são geralmente não reembolsáveis após o início de um período de faturação. No entanto, se nos contactar dentro de <strong className="text-white">7 dias</strong> após uma cobrança e não tiver feito uso substancial do Serviço durante esse período, analisaremos o seu pedido e emitiremos um reembolso a nosso critério.</p>
              <p>Queremos que fique satisfeito com o Groundswell. Se os dados de previsão não correspondem às suas expectativas para a sua região, diga-nos — podemos ajudar ou emitir um reembolso por cortesia.</p>
            </>,
          },
          {
            heading: 'Reembolsos — Subscrições Anuais',
            body: <p>Se subscreveu anualmente e deseja cancelar nos primeiros <strong className="text-white">30 dias</strong>, contacte-nos para um reembolso pro-rata pela parte não utilizada da sua subscrição. Após 30 dias, as subscrições anuais não são reembolsáveis, mas mantém acesso durante o período total pago.</p>,
          },
          {
            heading: 'Interrupções de Serviço',
            body: <p>Se o Groundswell sofrer uma interrupção significativa de serviço superior a 24 horas consecutivas, os subscritores afetados podem solicitar um crédito pelo período afetado. Emitiremos créditos proativamente para qualquer interrupção superior a 48 horas.</p>,
          },
          {
            heading: 'Como Solicitar um Reembolso',
            body: <p>Envie um e-mail para <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> com o endereço de e-mail da sua conta e o motivo do seu pedido. Respondemos em 2 dias úteis. Os reembolsos aprovados são devolvidos ao método de pagamento original no prazo de 5 a 10 dias úteis, dependendo do seu banco.</p>,
          },
          {
            heading: 'Período de Avaliação Gratuita',
            body: <p>Se for oferecido um período de avaliação gratuita, não será cobrado até que o período de avaliação termine. Pode cancelar a qualquer momento durante a avaliação sem qualquer custo. Não se aplica reembolso para um período de avaliação, pois não é efetuado qualquer pagamento.</p>,
          },
        ],
      }

    case 'es':
      return {
        title: 'Política de Reembolso y Cancelación',
        subtitle: 'Simple, justa y sin preguntas.',
        lastUpdated: '6 de mayo de 2026',
        sections: [
          {
            heading: 'Cancelación',
            body: <>
              <p>Puedes cancelar tu suscripción a Groundswell en cualquier momento desde la configuración de tu cuenta. La cancelación surte efecto al final del período de facturación actual — mantienes acceso completo al Servicio hasta entonces.</p>
              <p>Para cancelar, inicia sesión en <strong className="text-white">groundswell.surf</strong>, haz clic en el menú de tu cuenta y selecciona "Gestionar Facturación". Esto abre tu portal de facturación de Stripe donde puedes cancelar con un clic. Sin complicaciones ni flujos de retención.</p>
            </>,
          },
          {
            heading: 'Período de Desistimiento de 14 Días (UE)',
            body: <>
              <p>En virtud de la Directiva de Derechos de los Consumidores de la UE, si eres un consumidor residente en la Unión Europea, tienes derecho a desistir de un contrato de suscripción en un plazo de <strong className="text-white">14 días</strong> desde tu compra inicial sin dar ningún motivo.</p>
              <p>Para ejercer este derecho, envía un correo a <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> dentro de los 14 días posteriores a la suscripción con el asunto "Solicitud de Cancelación". Emitiremos un reembolso completo dentro de los 14 días posteriores a la recepción de tu solicitud.</p>
              <p>Ten en cuenta: si solicitas expresamente que el Servicio comience de inmediato (antes de que expire el período de 14 días) y luego desistes, es posible que se te cobre una cantidad proporcional por los días de uso.</p>
            </>,
          },
          {
            heading: 'Reembolsos — Suscripciones Mensuales',
            body: <>
              <p>Las cuotas de suscripción mensual generalmente no son reembolsables una vez iniciado un período de facturación. Sin embargo, si nos contactas dentro de los <strong className="text-white">7 días</strong> posteriores a un cargo y no has hecho un uso sustancial del Servicio durante ese período, revisaremos tu solicitud y emitiremos un reembolso a nuestra discreción.</p>
              <p>Queremos que estés satisfecho con Groundswell. Si los datos de pronóstico no cumplen tus expectativas para tu región, dínoslo — es posible que podamos ayudar o emitir un reembolso de cortesía.</p>
            </>,
          },
          {
            heading: 'Reembolsos — Suscripciones Anuales',
            body: <p>Si te suscribiste anualmente y deseas cancelar dentro de los primeros <strong className="text-white">30 días</strong>, contáctanos para obtener un reembolso prorrateado por la parte no utilizada de tu suscripción. Después de 30 días, las suscripciones anuales no son reembolsables, pero conservas el acceso durante el período completo pagado.</p>,
          },
          {
            heading: 'Interrupciones del Servicio',
            body: <p>Si Groundswell experimenta una interrupción significativa del servicio de más de 24 horas consecutivas, los suscriptores afectados podrán solicitar un crédito por el período afectado. Emitiremos créditos de manera proactiva para cualquier interrupción que supere las 48 horas.</p>,
          },
          {
            heading: 'Cómo Solicitar un Reembolso',
            body: <p>Envía un correo a <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> con el correo electrónico de tu cuenta y el motivo de tu solicitud. Respondemos en 2 días hábiles. Los reembolsos aprobados se devuelven a tu método de pago original en un plazo de 5 a 10 días hábiles, según tu banco.</p>,
          },
          {
            heading: 'Período de Prueba Gratuito',
            body: <p>Si se ofrece una prueba gratuita, no se realizará ningún cargo hasta que finalice el período de prueba. Puedes cancelar en cualquier momento durante la prueba sin ningún cargo. No se aplica reembolso para un período de prueba, ya que no se realiza ningún pago.</p>,
          },
        ],
      }

    case 'fr':
      return {
        title: 'Politique de Remboursement et d\'Annulation',
        subtitle: 'Simple, équitable et sans questions.',
        lastUpdated: '6 mai 2026',
        sections: [
          {
            heading: 'Annulation',
            body: <>
              <p>Vous pouvez annuler votre abonnement Groundswell à tout moment depuis les paramètres de votre compte. L'annulation prend effet à la fin de votre période de facturation actuelle — vous conservez un accès complet au Service jusqu'à cette date.</p>
              <p>Pour annuler, connectez-vous sur <strong className="text-white">groundswell.surf</strong>, cliquez sur le menu de votre compte et sélectionnez « Gérer la facturation ». Cela ouvre votre portail de facturation Stripe où vous pouvez annuler en un clic. Sans complications ni processus de rétention.</p>
            </>,
          },
          {
            heading: 'Période de Rétractation de 14 Jours (UE)',
            body: <>
              <p>En vertu de la Directive européenne sur les droits des consommateurs, si vous êtes un consommateur résidant dans l'Union européenne, vous avez le droit de vous rétracter d'un contrat d'abonnement dans un délai de <strong className="text-white">14 jours</strong> suivant votre achat initial, sans donner de raison.</p>
              <p>Pour exercer ce droit, envoyez un e-mail à <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> dans les 14 jours suivant votre abonnement avec l'objet « Demande d'annulation ». Nous émettrons un remboursement complet dans les 14 jours suivant la réception de votre demande.</p>
              <p>Veuillez noter : si vous demandez expressément que le Service commence immédiatement (avant l'expiration du délai de 14 jours) et que vous vous rétractez ensuite, vous pourrez être facturé d'un montant proportionnel aux jours d'utilisation.</p>
            </>,
          },
          {
            heading: 'Remboursements — Abonnements Mensuels',
            body: <>
              <p>Les frais d'abonnement mensuel ne sont généralement pas remboursables une fois la période de facturation commencée. Cependant, si vous nous contactez dans les <strong className="text-white">7 jours</strong> suivant un débit et que vous n'avez pas fait un usage substantiel du Service pendant cette période, nous examinerons votre demande et émettrons un remboursement à notre discrétion.</p>
              <p>Nous voulons que vous soyez satisfait de Groundswell. Si les données de prévision ne répondent pas à vos attentes pour votre région, dites-le nous — nous pourrons peut-être vous aider ou émettre un remboursement de courtoisie.</p>
            </>,
          },
          {
            heading: 'Remboursements — Abonnements Annuels',
            body: <p>Si vous vous êtes abonné annuellement et souhaitez annuler dans les <strong className="text-white">30 premiers jours</strong>, contactez-nous pour un remboursement au prorata de la partie inutilisée de votre abonnement. Après 30 jours, les abonnements annuels ne sont pas remboursables, mais vous conservez l'accès pendant toute la période payée.</p>,
          },
          {
            heading: 'Interruptions de Service',
            body: <p>Si Groundswell connaît une interruption de service significative de plus de 24 heures consécutives, les abonnés concernés peuvent demander un crédit pour la période affectée. Nous émettrons des crédits de manière proactive pour toute interruption dépassant 48 heures.</p>,
          },
          {
            heading: 'Comment Demander un Remboursement',
            body: <p>Envoyez un e-mail à <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> avec l'adresse e-mail de votre compte et la raison de votre demande. Nous répondons dans les 2 jours ouvrables. Les remboursements approuvés sont retournés sur votre moyen de paiement d'origine dans un délai de 5 à 10 jours ouvrables, selon votre banque.</p>,
          },
          {
            heading: 'Période d\'Essai Gratuite',
            body: <p>Si un essai gratuit est proposé, aucun débit ne sera effectué avant la fin de la période d'essai. Vous pouvez annuler à tout moment pendant l'essai sans frais. Aucun remboursement n'est applicable pour une période d'essai car aucun paiement n'est effectué.</p>,
          },
        ],
      }

    default:
      return {
        title: 'Refund & Cancellation Policy',
        subtitle: 'Simple, fair, and no questions asked.',
        lastUpdated: 'May 6, 2026',
        sections: [
          {
            heading: 'Cancellation',
            body: <>
              <p>You may cancel your Groundswell subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period — you retain full access to the Service until then.</p>
              <p>To cancel, sign in at <strong className="text-white">groundswell.surf</strong>, click your account menu, and select "Manage Billing." This opens your Stripe billing portal where you can cancel with one click. No hoops, no retention flows.</p>
            </>,
          },
          {
            heading: 'EU 14-Day Cooling-Off Period',
            body: <>
              <p>Under the EU Consumer Rights Directive, if you are a consumer resident in the European Union, you have the right to withdraw from a subscription contract within <strong className="text-white">14 days</strong> of your initial purchase without giving any reason.</p>
              <p>To exercise this right, email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> within 14 days of subscribing with the subject line "Cancellation Request." We will issue a full refund within 14 days of receiving your request.</p>
              <p>Please note: if you explicitly request that the Service begins immediately (before the 14-day period expires) and then withdraw, you may be charged a proportional amount for the days of use.</p>
            </>,
          },
          {
            heading: 'Refunds — Monthly Subscriptions',
            body: <>
              <p>Monthly subscription fees are generally non-refundable once a billing period has begun. However, if you contact us within <strong className="text-white">7 days</strong> of a charge and have not made substantial use of the Service during that period, we will review your request and issue a refund at our discretion.</p>
              <p>We want you to be happy with Groundswell. If the forecast data is not meeting your expectations for your region, tell us — we may be able to help or issue a courtesy refund.</p>
            </>,
          },
          {
            heading: 'Refunds — Annual Subscriptions',
            body: <p>If you subscribed annually and wish to cancel within the first <strong className="text-white">30 days</strong>, contact us for a pro-rated refund for the unused portion of your subscription. After 30 days, annual subscriptions are non-refundable but you retain access for the full paid period.</p>,
          },
          {
            heading: 'Service Outages',
            body: <p>If Groundswell experiences a significant service outage lasting more than 24 consecutive hours, affected subscribers may request a credit for the affected period. We will issue credits proactively for any outage exceeding 48 hours.</p>,
          },
          {
            heading: 'How to Request a Refund',
            body: <p>Email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> with your account email address and the reason for your request. We respond within 2 business days. Approved refunds are returned to your original payment method within 5–10 business days, depending on your bank.</p>,
          },
          {
            heading: 'Free Trial',
            body: <p>If a free trial is offered, it will not be charged until the trial period ends. You may cancel at any time during the trial with no charge. No refund is applicable for a trial period as no payment is taken.</p>,
          },
        ],
      }
  }
}

export default function RefundContent() {
  const { locale } = useLanguage()
  const content = getContent(locale)
  return <LegalPage {...content} />
}
