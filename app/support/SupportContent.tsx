'use client'

import LegalPage from '@/app/components/LegalPage'
import { useLanguage } from '@/app/i18n/LanguageContext'

function getContent(locale: string) {
  switch (locale) {
    case 'pt-PT':
    case 'pt-BR':
      return {
        title: 'Suporte',
        subtitle: 'Somos uma equipa pequena e lemos cada mensagem.',
        lastUpdated: '6 de maio de 2026',
        sections: [
          {
            heading: 'Contacte-nos',
            body: <>
              <p>A forma mais rápida de nos contactar é por e-mail:</p>
              <p className="mt-2">
                <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors text-base font-medium">
                  support@groundswell.surf
                </a>
              </p>
              <p className="mt-3 text-slate-400">Normalmente respondemos em 1 a 2 dias úteis. Para assuntos urgentes (acesso à conta, erros de faturação), inclua "URGENTE" na linha de assunto.</p>
            </>,
          },
          {
            heading: 'Faturação e Subscrições',
            body: <>
              <p>Para cancelar, atualizar ou alterar a sua subscrição, inicie sessão e clique em "Gerir Faturação" no menu da conta. Isso abre o portal de faturação Stripe onde pode gerir tudo diretamente.</p>
              <p>Para pedidos de reembolso, consulte a nossa <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Política de Reembolso e Cancelamento</a>. Para solicitar um reembolso, envie-nos um e-mail para <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
            </>,
          },
          {
            heading: 'Questões sobre Previsões',
            body: <>
              <p>O Groundswell utiliza fontes de dados abertas e verificadas para todas as previsões. Se uma previsão parecer errada para o seu local, há algumas coisas a saber:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li>Os dados de ondas provêm do modelo marítimo NEMO da Open-Meteo, atualizado de hora em hora.</li>
                <li>As previsões de marés provêm da NOAA CO-OPS e outras bases de dados harmónicas oficiais.</li>
                <li>Condições muito localizadas (quebras de recife, portos, foz de rios) podem diferir da saída do modelo em mar aberto.</li>
              </ul>
              <p className="mt-3">Pode consultar as nossas fontes de dados e estatísticas de precisão em direto na <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">página de Precisão</a>.</p>
            </>,
          },
          {
            heading: 'Privacidade e Pedidos de Dados',
            body: <p>Para solicitar uma cópia dos seus dados, pedir a eliminação ou exercer qualquer outro direito ao abrigo do RGPD, envie um e-mail para <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> com o assunto "Pedido de Dados". Consulte a nossa <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Política de Privacidade</a> para detalhes completos sobre os seus direitos.</p>,
          },
          {
            heading: 'Pedidos de Funcionalidades e Relatórios de Erros',
            body: <p>Adoramos ouvir surfistas. Se algo não funciona ou tem uma ideia para uma nova funcionalidade, envie-nos um e-mail para <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>. Lemos e consideramos cada sugestão.</p>,
          },
          {
            heading: 'Negócios e Imprensa',
            body: <p>Para parcerias, licenciamento ou consultas de imprensa, envie um e-mail para <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> com "Consulta Empresarial" na linha de assunto.</p>,
          },
        ],
      }

    case 'es':
      return {
        title: 'Soporte',
        subtitle: 'Somos un equipo pequeño y leemos cada mensaje.',
        lastUpdated: '6 de mayo de 2026',
        sections: [
          {
            heading: 'Contáctanos',
            body: <>
              <p>La forma más rápida de contactarnos es por correo electrónico:</p>
              <p className="mt-2">
                <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors text-base font-medium">
                  support@groundswell.surf
                </a>
              </p>
              <p className="mt-3 text-slate-400">Normalmente respondemos en 1 o 2 días hábiles. Para asuntos urgentes (acceso a la cuenta, errores de facturación), incluye "URGENTE" en el asunto.</p>
            </>,
          },
          {
            heading: 'Facturación y Suscripciones',
            body: <>
              <p>Para cancelar, actualizar o cambiar tu suscripción, inicia sesión y haz clic en "Gestionar Facturación" en el menú de cuenta. Esto abre tu portal de facturación de Stripe donde puedes gestionar todo directamente.</p>
              <p>Para solicitudes de reembolso, consulta nuestra <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Política de Reembolso y Cancelación</a>. Para solicitar un reembolso, envíanos un correo a <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
            </>,
          },
          {
            heading: 'Preguntas sobre Pronósticos',
            body: <>
              <p>Groundswell utiliza fuentes de datos abiertas y verificadas para todos los pronósticos. Si un pronóstico parece incorrecto para tu lugar local, hay algunas cosas que debes saber:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li>Los datos de olas provienen del modelo marino NEMO de Open-Meteo, actualizado cada hora.</li>
                <li>Las predicciones de mareas provienen de NOAA CO-OPS y otras bases de datos armónicas oficiales.</li>
                <li>Las condiciones muy localizadas (rompientes de arrecife, puertos, desembocaduras de ríos) pueden diferir de la salida del modelo en mar abierto.</li>
              </ul>
              <p className="mt-3">Puedes revisar nuestras fuentes de datos y estadísticas de precisión en vivo en la <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">página de Precisión</a>.</p>
            </>,
          },
          {
            heading: 'Privacidad y Solicitudes de Datos',
            body: <p>Para solicitar una copia de tus datos, pedir su eliminación o ejercer cualquier otro derecho del RGPD, envía un correo a <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> con el asunto "Solicitud de Datos". Consulta nuestra <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Política de Privacidad</a> para más detalles sobre tus derechos.</p>,
          },
          {
            heading: 'Solicitudes de Funciones e Informes de Errores',
            body: <p>Nos encanta escuchar a los surfistas. Si algo no funciona o tienes una idea para una nueva función, envíanos un correo a <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>. Leemos y consideramos cada sugerencia.</p>,
          },
          {
            heading: 'Consultas Empresariales y de Prensa',
            body: <p>Para consultas de asociación, licencia o prensa, envía un correo a <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> con "Consulta Empresarial" en el asunto.</p>,
          },
        ],
      }

    case 'fr':
      return {
        title: 'Support',
        subtitle: 'Nous sommes une petite équipe et lisons chaque message.',
        lastUpdated: '6 mai 2026',
        sections: [
          {
            heading: 'Nous Contacter',
            body: <>
              <p>La façon la plus rapide de nous contacter est par e-mail :</p>
              <p className="mt-2">
                <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors text-base font-medium">
                  support@groundswell.surf
                </a>
              </p>
              <p className="mt-3 text-slate-400">Nous répondons généralement dans un délai de 1 à 2 jours ouvrables. Pour les problèmes urgents (accès au compte, erreurs de facturation), veuillez inclure "URGENT" dans l'objet.</p>
            </>,
          },
          {
            heading: 'Facturation et Abonnements',
            body: <>
              <p>Pour annuler, mettre à niveau ou modifier votre abonnement, connectez-vous et cliquez sur "Gérer la facturation" dans le menu du compte. Cela ouvre votre portail de facturation Stripe où vous pouvez tout gérer directement.</p>
              <p>Pour les demandes de remboursement, consultez notre <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Politique de Remboursement et d'Annulation</a>. Pour demander un remboursement, envoyez-nous un e-mail à <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
            </>,
          },
          {
            heading: 'Questions sur les Prévisions',
            body: <>
              <p>Groundswell utilise des sources de données ouvertes et vérifiées pour toutes les prévisions. Si une prévision semble incorrecte pour votre spot local, voici quelques éléments à savoir :</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li>Les données de vagues proviennent du modèle marin NEMO d'Open-Meteo, mis à jour toutes les heures.</li>
                <li>Les prédictions de marées proviennent de NOAA CO-OPS et d'autres bases de données harmoniques officielles.</li>
                <li>Les conditions très localisées (breaks de récif, ports, embouchures de rivières) peuvent différer des sorties du modèle en plein océan.</li>
              </ul>
              <p className="mt-3">Vous pouvez consulter nos sources de données et les statistiques de précision en direct sur la <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">page Précision</a>.</p>
            </>,
          },
          {
            heading: 'Confidentialité et Demandes de Données',
            body: <p>Pour demander une copie de vos données, en demander la suppression ou exercer tout autre droit RGPD, envoyez un e-mail à <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> avec l'objet "Demande de Données". Consultez notre <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Politique de Confidentialité</a> pour tous les détails sur vos droits.</p>,
          },
          {
            heading: 'Demandes de Fonctionnalités et Signalement de Bugs',
            body: <p>Nous adorons entendre les surfeurs. Si quelque chose ne fonctionne pas ou si vous avez une idée pour une nouvelle fonctionnalité, envoyez-nous un e-mail à <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>. Nous lisons et considérons chaque suggestion.</p>,
          },
          {
            heading: 'Demandes Professionnelles et Presse',
            body: <p>Pour les demandes de partenariat, de licence ou de presse, envoyez un e-mail à <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> avec "Demande Professionnelle" dans l'objet.</p>,
          },
        ],
      }

    default:
      return {
        title: 'Support',
        subtitle: "We're a small team and we read every message.",
        lastUpdated: 'May 6, 2026',
        sections: [
          {
            heading: 'Contact Us',
            body: <>
              <p>The fastest way to reach us is by email:</p>
              <p className="mt-2">
                <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors text-base font-medium">
                  support@groundswell.surf
                </a>
              </p>
              <p className="mt-3 text-slate-400">We typically respond within 1–2 business days. For urgent issues (account access, billing errors), please include "URGENT" in the subject line.</p>
            </>,
          },
          {
            heading: 'Billing & Subscriptions',
            body: <>
              <p>To cancel, upgrade, or change your subscription, sign in and click "Manage Billing" in the account menu. This opens your Stripe billing portal where you can manage everything directly.</p>
              <p>For refund requests, see our <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Refund & Cancellation Policy</a>. To request a refund, email us at <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
            </>,
          },
          {
            heading: 'Forecast Questions',
            body: <>
              <p>Groundswell uses open, verified data sources for all forecasts. If a forecast looks wrong for your local spot, here are a few things to know:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li>Wave data comes from the Open-Meteo NEMO marine model, updated hourly.</li>
                <li>Tide predictions come from NOAA CO-OPS and other official harmonic databases.</li>
                <li>Very localized conditions (reef breaks, harbors, river mouths) may differ from open-ocean model output.</li>
              </ul>
              <p className="mt-3">You can review our data sources and live accuracy statistics on the <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Accuracy page</a>.</p>
            </>,
          },
          {
            heading: 'Privacy & Data Requests',
            body: <p>To request a copy of your data, ask for deletion, or exercise any other GDPR right, email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> with the subject "Data Request." See our <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Privacy Policy</a> for full details on your rights.</p>,
          },
          {
            heading: 'Feature Requests & Bug Reports',
            body: <p>We love hearing from surfers. If something is broken or you have an idea for a new feature, send us an email at <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>. We read and consider every suggestion.</p>,
          },
          {
            heading: 'Business & Press Inquiries',
            body: <p>For partnership, licensing, or press inquiries, email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a> with "Business Inquiry" in the subject line.</p>,
          },
        ],
      }
  }
}

export default function SupportContent() {
  const { locale } = useLanguage()
  const content = getContent(locale)
  return <LegalPage {...content} />
}
