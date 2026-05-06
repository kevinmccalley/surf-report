'use client'

import LegalPage from '@/app/components/LegalPage'
import { useLanguage } from '@/app/i18n/LanguageContext'

function getContent(locale: string) {
  switch (locale) {
    case 'pt-PT':
    case 'pt-BR':
      return {
        title: 'Termos de Serviço',
        subtitle: 'Por favor, leia estes termos com atenção antes de utilizar o Groundswell.',
        lastUpdated: '6 de maio de 2026',
        sections: [
          {
            heading: '1. Aceitação dos Termos',
            body: <>
              <p>Ao aceder ou utilizar o Groundswell em groundswell.surf (o "Serviço"), concorda em ficar vinculado a estes Termos de Serviço. Se não concordar, não poderá utilizar o Serviço.</p>
              <p>O Serviço é operado por Kevin McCalley ("nós"). Estes termos são regidos pelas leis de Portugal e pelos regulamentos aplicáveis da União Europeia.</p>
            </>,
          },
          {
            heading: '2. Descrição do Serviço',
            body: <>
              <p>O Groundswell fornece relatórios de surf em tempo real, previsões de ondas, previsões de marés e dados oceanográficos relacionados para locais em todo o mundo. Os dados de previsão são provenientes de fornecedores de dados abertos de terceiros, incluindo Open-Meteo e NOAA.</p>
              <p>As previsões são fornecidas apenas para fins informativos. As condições de surf e do oceano podem mudar rapidamente e sem aviso prévio. É da sua exclusiva responsabilidade avaliar se as condições são seguras antes de entrar na água.</p>
              <p><strong className="text-white">O Serviço não é uma ferramenta de segurança.</strong> Nunca confie exclusivamente nesta aplicação ao tomar decisões sobre atividades oceânicas. Consulte sempre múltiplas fontes, autoridades locais e utilize o seu próprio julgamento.</p>
            </>,
          },
          {
            heading: '3. Contas e Subscrições',
            body: <>
              <p>O acesso a todas as funcionalidades do Serviço requer uma subscrição paga. As subscrições são cobradas mensalmente ou anualmente. Deve fornecer informações de conta precisas no momento do registo.</p>
              <p>É responsável por manter a segurança das suas credenciais de conta. Deve notificar-nos imediatamente de qualquer utilização não autorizada da sua conta.</p>
              <p>Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos ou que sejam utilizadas de forma que prejudique o Serviço ou outros utilizadores.</p>
            </>,
          },
          {
            heading: '4. Pagamento',
            body: <>
              <p>Os pagamentos são processados pela Stripe, Inc. Ao fornecer informações de pagamento, autoriza-nos a cobrar a taxa de subscrição aplicável ao seu método de pagamento de forma recorrente até cancelar.</p>
              <p>Todos os preços estão em dólares americanos (USD) e são exclusivos de quaisquer impostos aplicáveis, que podem ser adicionados com base na sua localização. Para subscritores na UE, o IVA aplicável será calculado no momento da compra.</p>
              <p>Reservamo-nos o direito de alterar os preços das subscrições com 30 dias de aviso prévio. A utilização continuada do Serviço após uma alteração de preço constitui a aceitação do novo preço.</p>
            </>,
          },
          {
            heading: '5. Cancelamento e Reembolsos',
            body: <p>Pode cancelar a sua subscrição a qualquer momento. Consulte a nossa <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Política de Reembolso e Cancelamento</a> para mais detalhes, incluindo os direitos de desistência na UE.</p>,
          },
          {
            heading: '6. Propriedade Intelectual',
            body: <>
              <p>O nome Groundswell, logótipo, design da aplicação e conteúdo original são propriedade exclusiva de Kevin McCalley. Todos os direitos reservados.</p>
              <p>Os dados de previsão subjacentes são provenientes de fornecedores de dados abertos ao abrigo das respetivas licenças abertas e não são reivindicados como propriedade. Consulte a nossa página de <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Fontes de Dados</a> para atribuição.</p>
              <p>Não pode extrair, reproduzir, redistribuir ou criar trabalhos derivados do Serviço sem o nosso consentimento prévio por escrito.</p>
            </>,
          },
          {
            heading: '7. Exclusão de Garantias',
            body: <>
              <p>O Serviço é fornecido "tal como está" e "conforme disponível", sem garantias de qualquer tipo, expressas ou implícitas, incluindo, entre outras, garantias de comercialização, adequação a um fim específico ou exatidão dos dados de previsão.</p>
              <p>Não garantimos que o Serviço será ininterrupto, sem erros, nem que as previsões serão precisas para qualquer localização ou momento específico.</p>
            </>,
          },
          {
            heading: '8. Limitação de Responsabilidade',
            body: <p>Na máxima extensão permitida pela lei aplicável, não seremos responsáveis por quaisquer danos indiretos, acidentais, especiais, consequenciais ou punitivos, incluindo, entre outros, lesões pessoais, danos materiais ou perdas financeiras decorrentes da utilização do Serviço ou da confiança em dados de previsão. A nossa responsabilidade total para consigo por qualquer reclamação não excederá o valor pago por si pelo Serviço nos três meses anteriores à reclamação.</p>,
          },
          {
            heading: '9. Privacidade',
            body: <p>A sua utilização do Serviço é também regida pela nossa <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Política de Privacidade</a>, que é incorporada nestes Termos por referência.</p>,
          },
          {
            heading: '10. Alterações aos Termos',
            body: <p>Podemos atualizar estes Termos periodicamente. Notificaremos sobre alterações materiais por e-mail ou através de um aviso em destaque no Serviço. A utilização continuada do Serviço após a data de entrada em vigor de quaisquer alterações constitui a sua aceitação dos Termos revistos.</p>,
          },
          {
            heading: '11. Contacto',
            body: <p>Dúvidas sobre estes Termos? Contacte-nos na nossa <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">página de suporte</a> ou envie um e-mail para <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>,
          },
        ],
      }

    case 'es':
      return {
        title: 'Términos de Servicio',
        subtitle: 'Por favor, lee estos términos detenidamente antes de usar Groundswell.',
        lastUpdated: '6 de mayo de 2026',
        sections: [
          {
            heading: '1. Aceptación de los Términos',
            body: <>
              <p>Al acceder o usar Groundswell en groundswell.surf (el "Servicio"), aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo, no podrás usar el Servicio.</p>
              <p>El Servicio es operado por Kevin McCalley ("nosotros"). Estos términos se rigen por las leyes de Portugal y los reglamentos aplicables de la Unión Europea.</p>
            </>,
          },
          {
            heading: '2. Descripción del Servicio',
            body: <>
              <p>Groundswell proporciona informes de surf en tiempo real, pronósticos de olas, predicciones de mareas y datos oceanográficos relacionados para ubicaciones en todo el mundo. Los datos de pronóstico provienen de proveedores de datos abiertos de terceros, incluidos Open-Meteo y NOAA.</p>
              <p>Los pronósticos se proporcionan únicamente con fines informativos. Las condiciones del surf y del océano pueden cambiar rápidamente y sin previo aviso. Eres el único responsable de evaluar si las condiciones son seguras antes de entrar al agua.</p>
              <p><strong className="text-white">El Servicio no es una herramienta de seguridad.</strong> Nunca dependas únicamente de esta aplicación al tomar decisiones sobre actividades en el océano. Consulta siempre múltiples fuentes, autoridades locales y usa tu propio criterio.</p>
            </>,
          },
          {
            heading: '3. Cuentas y Suscripciones',
            body: <>
              <p>El acceso a todas las funciones del Servicio requiere una suscripción de pago. Las suscripciones se facturan mensual o anualmente. Debes proporcionar información de cuenta precisa al registrarte.</p>
              <p>Eres responsable de mantener la seguridad de las credenciales de tu cuenta. Debes notificarnos inmediatamente cualquier uso no autorizado de tu cuenta.</p>
              <p>Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos o que se usen de manera que perjudique el Servicio o a otros usuarios.</p>
            </>,
          },
          {
            heading: '4. Pago',
            body: <>
              <p>Los pagos son procesados por Stripe, Inc. Al proporcionar información de pago, nos autorizas a cobrar la tarifa de suscripción correspondiente a tu método de pago de forma recurrente hasta que canceles.</p>
              <p>Todos los precios están en dólares estadounidenses (USD) y no incluyen los impuestos aplicables, que pueden añadirse según tu ubicación. Para suscriptores de la UE, el IVA aplicable se calculará al momento del pago.</p>
              <p>Nos reservamos el derecho de cambiar los precios de suscripción con 30 días de aviso previo. El uso continuado del Servicio después de un cambio de precio constituye la aceptación del nuevo precio.</p>
            </>,
          },
          {
            heading: '5. Cancelación y Reembolsos',
            body: <p>Puedes cancelar tu suscripción en cualquier momento. Consulta nuestra <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Política de Reembolso y Cancelación</a> para más detalles, incluidos los derechos de desistimiento en la UE.</p>,
          },
          {
            heading: '6. Propiedad Intelectual',
            body: <>
              <p>El nombre Groundswell, logotipo, diseño de la aplicación y contenido original son propiedad exclusiva de Kevin McCalley. Todos los derechos reservados.</p>
              <p>Los datos de pronóstico subyacentes provienen de proveedores de datos abiertos bajo sus respectivas licencias abiertas y no se reivindican como propiedad. Consulta nuestra página de <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Fuentes de Datos</a> para atribución.</p>
              <p>No puedes extraer, reproducir, redistribuir ni crear obras derivadas del Servicio sin nuestro consentimiento previo por escrito.</p>
            </>,
          },
          {
            heading: '7. Exclusión de Garantías',
            body: <>
              <p>El Servicio se proporciona "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o implícitas, incluidas, entre otras, garantías de comerciabilidad, idoneidad para un propósito particular o exactitud de los datos de pronóstico.</p>
              <p>No garantizamos que el Servicio sea ininterrumpido, libre de errores, ni que los pronósticos sean precisos para ninguna ubicación o momento específico.</p>
            </>,
          },
          {
            heading: '8. Limitación de Responsabilidad',
            body: <p>En la máxima medida permitida por la ley aplicable, no seremos responsables de ningún daño indirecto, incidental, especial, consecuente o punitivo, incluidos, entre otros, lesiones personales, daños a la propiedad o pérdidas económicas derivadas del uso del Servicio o de la confianza en los datos de pronóstico. Nuestra responsabilidad total hacia ti por cualquier reclamación no excederá el importe pagado por ti por el Servicio en los tres meses anteriores a la reclamación.</p>,
          },
          {
            heading: '9. Privacidad',
            body: <p>Tu uso del Servicio también se rige por nuestra <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Política de Privacidad</a>, que se incorpora a estos Términos por referencia.</p>,
          },
          {
            heading: '10. Cambios en los Términos',
            body: <p>Podemos actualizar estos Términos periódicamente. Te notificaremos sobre cambios materiales por correo electrónico o mediante un aviso destacado en el Servicio. El uso continuado del Servicio después de la fecha de entrada en vigor de cualquier cambio constituye tu aceptación de los Términos revisados.</p>,
          },
          {
            heading: '11. Contacto',
            body: <p>¿Preguntas sobre estos Términos? Contáctanos en nuestra <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">página de soporte</a> o envíanos un correo a <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>,
          },
        ],
      }

    case 'fr':
      return {
        title: "Conditions d'Utilisation",
        subtitle: "Veuillez lire ces conditions attentivement avant d'utiliser Groundswell.",
        lastUpdated: '6 mai 2026',
        sections: [
          {
            heading: "1. Acceptation des Conditions",
            body: <>
              <p>En accédant ou en utilisant Groundswell sur groundswell.surf (le « Service »), vous acceptez d'être lié par ces Conditions d'Utilisation. Si vous n'êtes pas d'accord, vous ne pouvez pas utiliser le Service.</p>
              <p>Le Service est exploité par Kevin McCalley (« nous »). Ces conditions sont régies par les lois du Portugal et les réglementations applicables de l'Union européenne.</p>
            </>,
          },
          {
            heading: '2. Description du Service',
            body: <>
              <p>Groundswell fournit des rapports de surf en temps réel, des prévisions de vagues, des prédictions de marées et des données océanographiques connexes pour des locations dans le monde entier. Les données de prévision proviennent de fournisseurs de données ouvertes tiers, notamment Open-Meteo et NOAA.</p>
              <p>Les prévisions sont fournies à titre informatif uniquement. Les conditions de surf et d'océan peuvent changer rapidement et sans avertissement. Vous êtes seul responsable d'évaluer si les conditions sont sûres avant d'entrer dans l'eau.</p>
              <p><strong className="text-white">Le Service n'est pas un outil de sécurité.</strong> Ne vous fiez jamais uniquement à cette application pour prendre des décisions concernant les activités océaniques. Consultez toujours plusieurs sources, les autorités locales et utilisez votre propre jugement.</p>
            </>,
          },
          {
            heading: '3. Comptes et Abonnements',
            body: <>
              <p>L'accès à toutes les fonctionnalités du Service nécessite un abonnement payant. Les abonnements sont facturés mensuellement ou annuellement. Vous devez fournir des informations de compte précises lors de l'inscription.</p>
              <p>Vous êtes responsable de la sécurité de vos identifiants de compte. Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte.</p>
              <p>Nous nous réservons le droit de suspendre ou de résilier les comptes qui violent ces conditions ou qui sont utilisés d'une manière nuisant au Service ou aux autres utilisateurs.</p>
            </>,
          },
          {
            heading: '4. Paiement',
            body: <>
              <p>Les paiements sont traités par Stripe, Inc. En fournissant des informations de paiement, vous nous autorisez à débiter les frais d'abonnement applicables sur votre moyen de paiement de manière récurrente jusqu'à l'annulation.</p>
              <p>Tous les prix sont en dollars américains (USD) et n'incluent pas les taxes applicables, qui peuvent être ajoutées selon votre localisation. Pour les abonnés de l'UE, la TVA applicable sera calculée au moment du paiement.</p>
              <p>Nous nous réservons le droit de modifier les tarifs d'abonnement avec un préavis de 30 jours. La poursuite de l'utilisation du Service après une modification de prix constitue l'acceptation du nouveau tarif.</p>
            </>,
          },
          {
            heading: '5. Annulation et Remboursements',
            body: <p>Vous pouvez annuler votre abonnement à tout moment. Consultez notre <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Politique de Remboursement et d'Annulation</a> pour plus de détails, y compris les droits de rétractation dans l'UE.</p>,
          },
          {
            heading: '6. Propriété Intellectuelle',
            body: <>
              <p>Le nom Groundswell, le logo, le design de l'application et le contenu original sont la propriété exclusive de Kevin McCalley. Tous droits réservés.</p>
              <p>Les données de prévision sous-jacentes proviennent de fournisseurs de données ouvertes sous leurs licences ouvertes respectives et ne sont pas revendiquées comme propriété. Consultez notre page <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Sources de Données</a> pour les attributions.</p>
              <p>Vous ne pouvez pas extraire, reproduire, redistribuer ou créer des œuvres dérivées du Service sans notre consentement écrit préalable.</p>
            </>,
          },
          {
            heading: '7. Exclusion de Garanties',
            body: <>
              <p>Le Service est fourni « tel quel » et « selon disponibilité », sans garanties d'aucune sorte, expresses ou implicites, y compris, sans s'y limiter, les garanties de qualité marchande, d'adéquation à un usage particulier ou d'exactitude des données de prévision.</p>
              <p>Nous ne garantissons pas que le Service sera ininterrompu, exempt d'erreurs, ni que les prévisions seront précises pour un lieu ou une heure spécifique.</p>
            </>,
          },
          {
            heading: '8. Limitation de Responsabilité',
            body: <p>Dans la mesure maximale permise par la loi applicable, nous ne serons pas responsables des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, y compris, sans s'y limiter, les blessures corporelles, les dommages matériels ou les pertes financières résultant de l'utilisation du Service ou de la confiance accordée aux données de prévision. Notre responsabilité totale envers vous pour toute réclamation ne dépassera pas le montant payé par vous pour le Service au cours des trois mois précédant la réclamation.</p>,
          },
          {
            heading: '9. Confidentialité',
            body: <p>Votre utilisation du Service est également régie par notre <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Politique de Confidentialité</a>, qui est incorporée dans ces Conditions par référence.</p>,
          },
          {
            heading: '10. Modifications des Conditions',
            body: <p>Nous pouvons mettre à jour ces Conditions de temps à autre. Nous vous informerons des modifications importantes par e-mail ou en publiant un avis bien en évidence sur le Service. La poursuite de l'utilisation du Service après la date d'entrée en vigueur de tout changement constitue votre acceptation des Conditions révisées.</p>,
          },
          {
            heading: '11. Contact',
            body: <p>Des questions sur ces Conditions ? Contactez-nous sur notre <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">page de support</a> ou par e-mail à <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>,
          },
        ],
      }

    default:
      return {
        title: 'Terms of Service',
        subtitle: 'Please read these terms carefully before using Groundswell.',
        lastUpdated: 'May 6, 2026',
        sections: [
          {
            heading: '1. Acceptance of Terms',
            body: <>
              <p>By accessing or using Groundswell at groundswell.surf (the "Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service.</p>
              <p>The Service is operated by Kevin McCalley ("we," "us," or "our"). These terms are governed by the laws of Portugal and applicable European Union regulations.</p>
            </>,
          },
          {
            heading: '2. Description of Service',
            body: <>
              <p>Groundswell provides real-time surf reports, wave forecasts, tide predictions, and related oceanographic data for locations worldwide. Forecast data is sourced from third-party open data providers including Open-Meteo and NOAA.</p>
              <p>Forecasts are provided for informational purposes only. Surf and ocean conditions can change rapidly and without warning. You are solely responsible for assessing whether conditions are safe before entering the water.</p>
              <p><strong className="text-white">The Service is not a safety tool.</strong> Never rely solely on this application when making decisions about ocean activities. Always consult multiple sources, local authorities, and use your own judgment.</p>
            </>,
          },
          {
            heading: '3. Accounts and Subscriptions',
            body: <>
              <p>Access to full Service features requires a paid subscription. Subscriptions are billed on a monthly or annual basis. You must provide accurate account information when registering.</p>
              <p>You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorized use of your account.</p>
              <p>We reserve the right to suspend or terminate accounts that violate these terms or are used in a manner that harms the Service or other users.</p>
            </>,
          },
          {
            heading: '4. Payment',
            body: <>
              <p>Payments are processed by Stripe, Inc. By providing payment information, you authorize us to charge the applicable subscription fee to your payment method on a recurring basis until you cancel.</p>
              <p>All prices are in US dollars (USD) and are exclusive of any applicable taxes, which may be added based on your location. For EU-based subscribers, applicable VAT will be calculated at checkout.</p>
              <p>We reserve the right to change subscription pricing with 30 days' advance notice. Continued use of the Service after a price change constitutes acceptance of the new price.</p>
            </>,
          },
          {
            heading: '5. Cancellation and Refunds',
            body: <p>You may cancel your subscription at any time. See our <a href="/refund" className="text-sky-400 hover:text-sky-300 transition-colors">Refund and Cancellation Policy</a> for full details, including EU cooling-off rights.</p>,
          },
          {
            heading: '6. Intellectual Property',
            body: <>
              <p>The Groundswell name, logo, application design, and original content are the exclusive property of Kevin McCalley. All rights are reserved.</p>
              <p>Underlying forecast data is sourced from open-data providers under their respective open licenses and is not claimed as proprietary. See our <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Data Sources</a> page for attribution.</p>
              <p>You may not scrape, reproduce, redistribute, or create derivative works from the Service without our prior written consent.</p>
            </>,
          },
          {
            heading: '7. Disclaimer of Warranties',
            body: <>
              <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or accuracy of forecast data.</p>
              <p>We do not warrant that the Service will be uninterrupted, error-free, or that any forecasts will be accurate for any specific location or time.</p>
            </>,
          },
          {
            heading: '8. Limitation of Liability',
            body: <p>To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to personal injury, property damage, or financial loss arising from use of the Service or reliance on forecast data. Our total liability to you for any claim shall not exceed the amount paid by you for the Service in the three months preceding the claim.</p>,
          },
          {
            heading: '9. Privacy',
            body: <p>Your use of the Service is also governed by our <a href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>,
          },
          {
            heading: '10. Changes to Terms',
            body: <p>We may update these Terms from time to time. We will notify you of material changes by email or by prominently posting a notice on the Service. Continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Terms.</p>,
          },
          {
            heading: '11. Contact',
            body: <p>Questions about these Terms? Contact us at <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">our support page</a> or email <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>,
          },
        ],
      }
  }
}

export default function TermsContent() {
  const { locale } = useLanguage()
  const content = getContent(locale)
  return <LegalPage {...content} />
}
