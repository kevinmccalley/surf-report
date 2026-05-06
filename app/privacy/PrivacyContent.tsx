'use client'

import LegalPage from '@/app/components/LegalPage'
import { useLanguage } from '@/app/i18n/LanguageContext'

function getContent(locale: string) {
  switch (locale) {
    case 'pt-PT':
    case 'pt-BR':
      return {
        title: 'Política de Privacidade',
        subtitle: 'Recolhemos apenas o necessário e nunca vendemos os seus dados.',
        lastUpdated: '6 de maio de 2026',
        sections: [
          {
            heading: '1. Quem Somos',
            body: <>
              <p>O Groundswell (groundswell.surf) é operado por Kevin McCalley, Portugal. Para todos os assuntos relacionados com privacidade, incluindo pedidos de titulares de dados, contacte-nos em <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
              <p>Somos o responsável pelo tratamento dos dados pessoais recolhidos através deste Serviço. Esta política explica quais os dados que recolhemos, o motivo, como são utilizados e os seus direitos ao abrigo do Regulamento Geral sobre a Proteção de Dados (RGPD) da UE e da legislação portuguesa de proteção de dados aplicável.</p>
            </>,
          },
          {
            heading: '2. Dados que Recolhemos',
            body: <>
              <p><strong className="text-white">Dados de conta:</strong> Quando se regista, recolhemos o seu endereço de e-mail e quaisquer informações de perfil que fornecer. A autenticação de conta é gerida pela Clerk, Inc.</p>
              <p><strong className="text-white">Dados de pagamento:</strong> As informações de faturação (dados do cartão, endereço de faturação) são recolhidas e armazenadas exclusivamente pela Stripe, Inc. Não armazenamos o número completo do seu cartão ou CVV nos nossos servidores.</p>
              <p><strong className="text-white">Dados de utilização:</strong> Recolhemos análises anonimizadas (visualizações de página, utilização de funcionalidades) através do Vercel Analytics para melhorar o Serviço. Não são incluídos identificadores pessoais.</p>
              <p><strong className="text-white">Dados de localização:</strong> Quando pesquisa um local de surf, essa localização é utilizada para obter dados de previsão. Não armazenamos de forma persistente o seu histórico de pesquisas nem o associamos à sua identidade de conta.</p>
              <p><strong className="text-white">Dados técnicos:</strong> Registos de servidor padrão (endereço IP, tipo de browser, timestamps de pedidos) são retidos até 30 dias para fins de segurança e depuração.</p>
            </>,
          },
          {
            heading: '3. Por que Tratamos os Seus Dados (Base Jurídica)',
            body: <ul className="list-disc list-inside space-y-1 ml-1">
              <li><strong className="text-white">Execução de contrato:</strong> Os dados de conta e pagamento são tratados para fornecer e faturar o Serviço.</li>
              <li><strong className="text-white">Interesses legítimos:</strong> As análises de utilização e os registos de servidor são tratados para manter a segurança e melhorar o Serviço.</li>
              <li><strong className="text-white">Obrigação legal:</strong> Retemos certos registos de transações conforme exigido pela legislação fiscal portuguesa e da UE.</li>
            </ul>,
          },
          {
            heading: '4. Subcontratantes Terceiros',
            body: <>
              <p>Partilhamos dados com os seguintes subcontratantes, cada um vinculado por acordos de tratamento de dados adequados:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li><strong className="text-white">Clerk, Inc.</strong> — autenticação e gestão de conta (EUA, aplicam-se Cláusulas Contratuais Padrão da UE)</li>
                <li><strong className="text-white">Stripe, Inc.</strong> — processamento de pagamentos (EUA/UE, em conformidade com PCI-DSS)</li>
                <li><strong className="text-white">Vercel, Inc.</strong> — alojamento, deployment e análises (EUA, aplicam-se CCP da UE)</li>
                <li><strong className="text-white">Redis Ltd.</strong> — cache de curto prazo de resultados de previsão não pessoais (EUA)</li>
              </ul>
              <p className="mt-3">Não vendemos, alugamos nem partilhamos os seus dados pessoais com terceiros para fins de marketing.</p>
            </>,
          },
          {
            heading: '5. Retenção de Dados',
            body: <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Dados de conta: retidos durante a duração da sua subscrição mais 12 meses, depois eliminados a pedido.</li>
              <li>Registos de pagamento: retidos por 7 anos conforme exigido pela legislação fiscal da UE.</li>
              <li>Registos de servidor: eliminados após 30 dias.</li>
              <li>Dados de previsão em cache: expiram automaticamente em 6 horas, sem identificadores pessoais.</li>
            </ul>,
          },
          {
            heading: '6. Os Seus Direitos ao Abrigo do RGPD',
            body: <>
              <p>Como titular de dados na UE/EEE, tem os seguintes direitos, que pode exercer a qualquer momento contactando-nos:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li><strong className="text-white">Acesso:</strong> solicitar uma cópia de todos os dados pessoais que detemos sobre si.</li>
                <li><strong className="text-white">Retificação:</strong> solicitar a correção de dados inexatos.</li>
                <li><strong className="text-white">Apagamento:</strong> solicitar a eliminação dos seus dados ("direito a ser esquecido"), sujeito a obrigações legais de retenção.</li>
                <li><strong className="text-white">Limitação:</strong> solicitar que limitemos o tratamento dos seus dados em determinadas circunstâncias.</li>
                <li><strong className="text-white">Portabilidade:</strong> receber os seus dados num formato estruturado e legível por máquina.</li>
                <li><strong className="text-white">Oposição:</strong> opor-se ao tratamento baseado em interesses legítimos.</li>
                <li><strong className="text-white">Retirar consentimento:</strong> quando o tratamento se baseia em consentimento, pode retirá-lo a qualquer momento.</li>
              </ul>
              <p className="mt-3">Para exercer qualquer um destes direitos, envie um e-mail para <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>. Responderemos no prazo de 30 dias.</p>
            </>,
          },
          {
            heading: '7. Direito de Apresentar Reclamação',
            body: <p>Se considerar que não tratámos os seus dados de forma lícita, tem o direito de apresentar uma reclamação junto da autoridade supervisora de proteção de dados portuguesa: <strong className="text-white">Comissão Nacional de Proteção de Dados (CNPD)</strong>, Av. D. Carlos I, 134 — 1º, 1200-651 Lisboa, Portugal. Website: <span className="text-slate-300">cnpd.pt</span>.</p>,
          },
          {
            heading: '8. Cookies',
            body: <p>Utilizamos apenas cookies estritamente necessários para a gestão de sessões de autenticação (via Clerk). Não utilizamos cookies de publicidade, rastreamento ou marketing de terceiros. Não é necessário um banner de consentimento de cookies, pois não utilizamos cookies não essenciais.</p>,
          },
          {
            heading: '9. Transferências Internacionais',
            body: <p>Alguns dos nossos subcontratantes estão localizados nos Estados Unidos. Quando os dados pessoais são transferidos para fora da UE/EEE, garantimos a existência de salvaguardas adequadas, incluindo a utilização de Cláusulas Contratuais Padrão da UE (CCP) aprovadas pela Comissão Europeia.</p>,
          },
          {
            heading: '10. Alterações a Esta Política',
            body: <p>Podemos atualizar esta política periodicamente. Notificaremos sobre alterações materiais por e-mail. A versão atual está sempre disponível em groundswell.surf/privacy.</p>,
          },
        ],
      }

    case 'es':
      return {
        title: 'Política de Privacidad',
        subtitle: 'Solo recopilamos lo necesario y nunca vendemos tus datos.',
        lastUpdated: '6 de mayo de 2026',
        sections: [
          {
            heading: '1. Quiénes Somos',
            body: <>
              <p>Groundswell (groundswell.surf) es operado por Kevin McCalley, Portugal. Para todos los asuntos relacionados con la privacidad, incluidas las solicitudes de los interesados, contáctanos en <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
              <p>Somos el responsable del tratamiento de los datos personales recopilados a través de este Servicio. Esta política explica qué datos recopilamos, por qué, cómo se utilizan y tus derechos en virtud del Reglamento General de Protección de Datos (RGPD) de la UE y la legislación portuguesa de protección de datos aplicable.</p>
            </>,
          },
          {
            heading: '2. Datos que Recopilamos',
            body: <>
              <p><strong className="text-white">Datos de cuenta:</strong> Al registrarte, recopilamos tu dirección de correo electrónico y cualquier información de perfil que proporciones. La autenticación de la cuenta es gestionada por Clerk, Inc.</p>
              <p><strong className="text-white">Datos de pago:</strong> La información de facturación (datos de tarjeta, dirección de facturación) es recopilada y almacenada exclusivamente por Stripe, Inc. No almacenamos el número completo de tu tarjeta ni el CVV en nuestros servidores.</p>
              <p><strong className="text-white">Datos de uso:</strong> Recopilamos análisis anonimizados (vistas de página, uso de funciones) a través de Vercel Analytics para mejorar el Servicio. No se incluyen identificadores personales.</p>
              <p><strong className="text-white">Datos de ubicación:</strong> Cuando buscas un lugar de surf, esa ubicación se utiliza para obtener datos de pronóstico. No almacenamos de forma persistente tu historial de búsquedas ni lo vinculamos a tu identidad de cuenta.</p>
              <p><strong className="text-white">Datos técnicos:</strong> Los registros de servidor estándar (dirección IP, tipo de navegador, marcas de tiempo de solicitudes) se conservan hasta 30 días con fines de seguridad y depuración.</p>
            </>,
          },
          {
            heading: '3. Por qué Tratamos tus Datos (Base Legal)',
            body: <ul className="list-disc list-inside space-y-1 ml-1">
              <li><strong className="text-white">Ejecución del contrato:</strong> Los datos de cuenta y pago se procesan para proporcionar y facturar el Servicio.</li>
              <li><strong className="text-white">Intereses legítimos:</strong> Los análisis de uso y los registros de servidor se procesan para mantener la seguridad y mejorar el Servicio.</li>
              <li><strong className="text-white">Obligación legal:</strong> Conservamos ciertos registros de transacciones según lo exigido por la legislación fiscal portuguesa y de la UE.</li>
            </ul>,
          },
          {
            heading: '4. Terceros Encargados del Tratamiento',
            body: <>
              <p>Compartimos datos con los siguientes encargados del tratamiento, cada uno vinculado por acuerdos de tratamiento de datos adecuados:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li><strong className="text-white">Clerk, Inc.</strong> — autenticación y gestión de cuentas (EE. UU., se aplican Cláusulas Contractuales Estándar de la UE)</li>
                <li><strong className="text-white">Stripe, Inc.</strong> — procesamiento de pagos (EE. UU./UE, conforme a PCI-DSS)</li>
                <li><strong className="text-white">Vercel, Inc.</strong> — alojamiento, despliegue y análisis (EE. UU., se aplican CCE de la UE)</li>
                <li><strong className="text-white">Redis Ltd.</strong> — almacenamiento en caché a corto plazo de resultados de pronóstico no personales (EE. UU.)</li>
              </ul>
              <p className="mt-3">No vendemos, alquilamos ni compartimos tus datos personales con terceros con fines de marketing.</p>
            </>,
          },
          {
            heading: '5. Conservación de Datos',
            body: <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Datos de cuenta: conservados durante la duración de tu suscripción más 12 meses, luego eliminados a petición.</li>
              <li>Registros de pago: conservados durante 7 años según lo exigido por la legislación fiscal de la UE.</li>
              <li>Registros de servidor: eliminados después de 30 días.</li>
              <li>Datos de pronóstico en caché: expiran automáticamente en 6 horas, sin identificadores personales.</li>
            </ul>,
          },
          {
            heading: '6. Tus Derechos bajo el RGPD',
            body: <>
              <p>Como interesado en la UE/EEE, tienes los siguientes derechos, que puedes ejercer en cualquier momento poniéndote en contacto con nosotros:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li><strong className="text-white">Acceso:</strong> solicitar una copia de todos los datos personales que tenemos sobre ti.</li>
                <li><strong className="text-white">Rectificación:</strong> solicitar la corrección de datos inexactos.</li>
                <li><strong className="text-white">Supresión:</strong> solicitar la eliminación de tus datos ("derecho al olvido"), sujeto a obligaciones legales de conservación.</li>
                <li><strong className="text-white">Limitación:</strong> solicitar que limitemos el tratamiento de tus datos en determinadas circunstancias.</li>
                <li><strong className="text-white">Portabilidad:</strong> recibir tus datos en un formato estructurado y legible por máquina.</li>
                <li><strong className="text-white">Oposición:</strong> oponerte al tratamiento basado en intereses legítimos.</li>
                <li><strong className="text-white">Retirar el consentimiento:</strong> cuando el tratamiento se basa en el consentimiento, puedes retirarlo en cualquier momento.</li>
              </ul>
              <p className="mt-3">Para ejercer cualquiera de estos derechos, envía un correo a <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>. Responderemos en un plazo de 30 días.</p>
            </>,
          },
          {
            heading: '7. Derecho a Presentar una Reclamación',
            body: <p>Si crees que no hemos tratado tus datos legalmente, tienes derecho a presentar una reclamación ante la autoridad supervisora portuguesa de protección de datos: <strong className="text-white">Comissão Nacional de Proteção de Dados (CNPD)</strong>, Av. D. Carlos I, 134 — 1º, 1200-651 Lisboa, Portugal. Sitio web: <span className="text-slate-300">cnpd.pt</span>.</p>,
          },
          {
            heading: '8. Cookies',
            body: <p>Utilizamos únicamente cookies estrictamente necesarias para la gestión de sesiones de autenticación (a través de Clerk). No utilizamos cookies de publicidad, rastreo o marketing de terceros. No se requiere un banner de consentimiento de cookies, ya que no utilizamos cookies no esenciales.</p>,
          },
          {
            heading: '9. Transferencias Internacionales',
            body: <p>Algunos de nuestros encargados del tratamiento están ubicados en los Estados Unidos. Cuando los datos personales se transfieren fuera de la UE/EEE, garantizamos la existencia de salvaguardas adecuadas, incluido el uso de Cláusulas Contractuales Estándar (CCE) de la UE aprobadas por la Comisión Europea.</p>,
          },
          {
            heading: '10. Cambios en Esta Política',
            body: <p>Podemos actualizar esta política de vez en cuando. Te notificaremos sobre cambios importantes por correo electrónico. La versión actual siempre está disponible en groundswell.surf/privacy.</p>,
          },
        ],
      }

    case 'fr':
      return {
        title: 'Politique de Confidentialité',
        subtitle: 'Nous ne collectons que le nécessaire et ne vendons jamais vos données.',
        lastUpdated: '6 mai 2026',
        sections: [
          {
            heading: '1. Qui Sommes-Nous',
            body: <>
              <p>Groundswell (groundswell.surf) est exploité par Kevin McCalley, Portugal. Pour toutes les questions relatives à la confidentialité, y compris les demandes des personnes concernées, contactez-nous à <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
              <p>Nous sommes le responsable du traitement des données personnelles collectées via ce Service. Cette politique explique quelles données nous collectons, pourquoi, comment elles sont utilisées et vos droits en vertu du Règlement général sur la protection des données (RGPD) de l'UE et de la législation portugaise applicable sur la protection des données.</p>
            </>,
          },
          {
            heading: '2. Données que Nous Collectons',
            body: <>
              <p><strong className="text-white">Données de compte :</strong> Lors de votre inscription, nous collectons votre adresse e-mail et les informations de profil que vous fournissez. L'authentification du compte est gérée par Clerk, Inc.</p>
              <p><strong className="text-white">Données de paiement :</strong> Les informations de facturation (données de carte, adresse de facturation) sont collectées et stockées exclusivement par Stripe, Inc. Nous ne stockons pas votre numéro de carte complet ni le CVV sur nos serveurs.</p>
              <p><strong className="text-white">Données d'utilisation :</strong> Nous collectons des analyses anonymisées (vues de pages, utilisation des fonctionnalités) via Vercel Analytics pour améliorer le Service. Aucun identifiant personnel n'est inclus.</p>
              <p><strong className="text-white">Données de localisation :</strong> Lorsque vous recherchez un spot de surf, cette localisation est utilisée pour récupérer des données de prévision. Nous ne stockons pas de manière persistante votre historique de recherche ni ne le lions à votre identité de compte.</p>
              <p><strong className="text-white">Données techniques :</strong> Les journaux de serveur standard (adresse IP, type de navigateur, horodatages des requêtes) sont conservés jusqu'à 30 jours à des fins de sécurité et de débogage.</p>
            </>,
          },
          {
            heading: '3. Pourquoi Nous Traitons Vos Données (Base Légale)',
            body: <ul className="list-disc list-inside space-y-1 ml-1">
              <li><strong className="text-white">Exécution du contrat :</strong> Les données de compte et de paiement sont traitées pour fournir et facturer le Service.</li>
              <li><strong className="text-white">Intérêts légitimes :</strong> Les analyses d'utilisation et les journaux de serveur sont traités pour maintenir la sécurité et améliorer le Service.</li>
              <li><strong className="text-white">Obligation légale :</strong> Nous conservons certains enregistrements de transactions conformément à la législation fiscale portugaise et européenne.</li>
            </ul>,
          },
          {
            heading: '4. Sous-traitants Tiers',
            body: <>
              <p>Nous partageons des données avec les sous-traitants suivants, chacun lié par des accords de traitement des données appropriés :</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li><strong className="text-white">Clerk, Inc.</strong> — authentification et gestion de compte (États-Unis, Clauses Contractuelles Types de l'UE applicables)</li>
                <li><strong className="text-white">Stripe, Inc.</strong> — traitement des paiements (États-Unis/UE, conforme PCI-DSS)</li>
                <li><strong className="text-white">Vercel, Inc.</strong> — hébergement, déploiement et analyses (États-Unis, CCT de l'UE applicables)</li>
                <li><strong className="text-white">Redis Ltd.</strong> — mise en cache à court terme des résultats de prévision non personnels (États-Unis)</li>
              </ul>
              <p className="mt-3">Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers à des fins de marketing.</p>
            </>,
          },
          {
            heading: '5. Conservation des Données',
            body: <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Données de compte : conservées pendant la durée de votre abonnement plus 12 mois, puis supprimées sur demande.</li>
              <li>Enregistrements de paiement : conservés pendant 7 ans conformément à la législation fiscale de l'UE.</li>
              <li>Journaux de serveur : supprimés après 30 jours.</li>
              <li>Données de prévision en cache : expirent automatiquement dans les 6 heures, sans identifiants personnels.</li>
            </ul>,
          },
          {
            heading: '6. Vos Droits en vertu du RGPD',
            body: <>
              <p>En tant que personne concernée dans l'UE/EEE, vous disposez des droits suivants, que vous pouvez exercer à tout moment en nous contactant :</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li><strong className="text-white">Accès :</strong> demander une copie de toutes les données personnelles que nous détenons vous concernant.</li>
                <li><strong className="text-white">Rectification :</strong> demander la correction des données inexactes.</li>
                <li><strong className="text-white">Effacement :</strong> demander la suppression de vos données (« droit à l'oubli »), sous réserve des obligations légales de conservation.</li>
                <li><strong className="text-white">Limitation :</strong> demander que nous limitions le traitement de vos données dans certaines circonstances.</li>
                <li><strong className="text-white">Portabilité :</strong> recevoir vos données dans un format structuré et lisible par machine.</li>
                <li><strong className="text-white">Opposition :</strong> vous opposer au traitement fondé sur des intérêts légitimes.</li>
                <li><strong className="text-white">Retrait du consentement :</strong> lorsque le traitement est fondé sur le consentement, vous pouvez le retirer à tout moment.</li>
              </ul>
              <p className="mt-3">Pour exercer l'un de ces droits, envoyez un e-mail à <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>. Nous répondrons dans les 30 jours.</p>
            </>,
          },
          {
            heading: '7. Droit de Déposer une Plainte',
            body: <p>Si vous estimez que nous n'avons pas traité vos données de manière légale, vous avez le droit de déposer une plainte auprès de l'autorité de contrôle portugaise de la protection des données : <strong className="text-white">Comissão Nacional de Proteção de Dados (CNPD)</strong>, Av. D. Carlos I, 134 — 1º, 1200-651 Lisboa, Portugal. Site web : <span className="text-slate-300">cnpd.pt</span>.</p>,
          },
          {
            heading: '8. Cookies',
            body: <p>Nous utilisons uniquement des cookies strictement nécessaires à la gestion des sessions d'authentification (via Clerk). Nous n'utilisons pas de cookies publicitaires, de suivi ou de marketing tiers. Aucune bannière de consentement aux cookies n'est requise car nous n'utilisons pas de cookies non essentiels.</p>,
          },
          {
            heading: '9. Transferts Internationaux',
            body: <p>Certains de nos sous-traitants sont situés aux États-Unis. Lorsque des données personnelles sont transférées hors de l'UE/EEE, nous veillons à ce que des garanties appropriées soient en place, notamment l'utilisation des Clauses Contractuelles Types (CCT) de l'UE approuvées par la Commission européenne.</p>,
          },
          {
            heading: '10. Modifications de Cette Politique',
            body: <p>Nous pouvons mettre à jour cette politique de temps à autre. Nous vous informerons des modifications importantes par e-mail. La version actuelle est toujours disponible sur groundswell.surf/privacy.</p>,
          },
        ],
      }

    default:
      return {
        title: 'Privacy Policy',
        subtitle: 'We collect only what we need and never sell your data.',
        lastUpdated: 'May 6, 2026',
        sections: [
          {
            heading: '1. Who We Are',
            body: <>
              <p>Groundswell (groundswell.surf) is operated by Kevin McCalley, Portugal. For all privacy-related matters, including data subject requests, contact us at <a href="mailto:support@groundswell.surf" className="text-sky-400 hover:text-sky-300 transition-colors">support@groundswell.surf</a>.</p>
              <p>We are the data controller for personal data collected through this Service. This policy explains what data we collect, why, how it is used, and your rights under the EU General Data Protection Regulation (GDPR) and applicable Portuguese data protection law.</p>
            </>,
          },
          {
            heading: '2. Data We Collect',
            body: <>
              <p><strong className="text-white">Account data:</strong> When you register, we collect your email address and any profile information you provide. Account authentication is handled by Clerk, Inc.</p>
              <p><strong className="text-white">Payment data:</strong> Billing information (card details, billing address) is collected and stored exclusively by Stripe, Inc. We do not store your full card number or CVV on our servers.</p>
              <p><strong className="text-white">Usage data:</strong> We collect anonymized analytics (page views, feature usage) through Vercel Analytics to improve the Service. No personal identifiers are included.</p>
              <p><strong className="text-white">Location data:</strong> When you search for a surf location, that location is used to fetch forecast data. We do not persistently store your search history or link it to your account identity.</p>
              <p><strong className="text-white">Technical data:</strong> Standard server logs (IP address, browser type, request timestamps) are retained for up to 30 days for security and debugging purposes.</p>
            </>,
          },
          {
            heading: '3. Why We Process Your Data (Legal Basis)',
            body: <ul className="list-disc list-inside space-y-1 ml-1">
              <li><strong className="text-white">Contract performance:</strong> Account and payment data are processed to provide and bill for the Service.</li>
              <li><strong className="text-white">Legitimate interests:</strong> Usage analytics and server logs are processed to maintain security and improve the Service.</li>
              <li><strong className="text-white">Legal obligation:</strong> We retain certain transaction records as required by Portuguese and EU tax law.</li>
            </ul>,
          },
          {
            heading: '4. Third-Party Processors',
            body: <>
              <p>We share data with the following processors, each bound by appropriate data processing agreements:</p>
              <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
                <li><strong className="text-white">Clerk, Inc.</strong> — authentication and account management (US, EU Standard Contractual Clauses apply)</li>
                <li><strong className="text-white">Stripe, Inc.</strong> — payment processing (US/EU, PCI-DSS compliant)</li>
                <li><strong className="text-white">Vercel, Inc.</strong> — hosting, deployment, and analytics (US, EU SCCs apply)</li>
                <li><strong className="text-white">Redis Ltd.</strong> — short-term caching of non-personal forecast results (US)</li>
              </ul>
              <p className="mt-3">We do not sell, rent, or share your personal data with any third party for marketing purposes.</p>
            </>,
          },
          {
            heading: '5. Data Retention',
            body: <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Account data: retained for the duration of your subscription plus 12 months, then deleted on request.</li>
              <li>Payment records: retained for 7 years as required by EU tax law.</li>
              <li>Server logs: deleted after 30 days.</li>
              <li>Cached forecast data: automatically expires within 6 hours, contains no personal identifiers.</li>
            </ul>,
          },
          {
            heading: '6. Your Rights Under GDPR',
            body: <>
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
            </>,
          },
          {
            heading: '7. Right to Lodge a Complaint',
            body: <p>If you believe we have not handled your data lawfully, you have the right to lodge a complaint with the Portuguese data protection supervisory authority: <strong className="text-white">Comissão Nacional de Proteção de Dados (CNPD)</strong>, Av. D. Carlos I, 134 — 1º, 1200-651 Lisboa, Portugal. Website: <span className="text-slate-300">cnpd.pt</span>.</p>,
          },
          {
            heading: '8. Cookies',
            body: <p>We use only strictly necessary cookies for authentication session management (via Clerk). We do not use advertising, tracking, or third-party marketing cookies. No cookie consent banner is required as we do not use non-essential cookies.</p>,
          },
          {
            heading: '9. International Transfers',
            body: <p>Some of our processors are located in the United States. Where personal data is transferred outside the EU/EEA, we ensure appropriate safeguards are in place, including the use of EU Standard Contractual Clauses (SCCs) as approved by the European Commission.</p>,
          },
          {
            heading: '10. Changes to This Policy',
            body: <p>We may update this policy from time to time. We will notify you of material changes by email. The current version is always available at groundswell.surf/privacy.</p>,
          },
        ],
      }
  }
}

export default function PrivacyContent() {
  const { locale } = useLanguage()
  const content = getContent(locale)
  return <LegalPage {...content} />
}
