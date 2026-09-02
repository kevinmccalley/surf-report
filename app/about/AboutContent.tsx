'use client'

import LegalPage from '@/app/components/LegalPage'
import { useLanguage } from '@/app/i18n/LanguageContext'

function getContent(locale: string) {
  switch (locale) {
    case 'es':
      return {
        title: 'Acerca de Groundswell',
        subtitle: 'Qué es Groundswell, de dónde vienen los datos y quién lo hace.',
        lastUpdated: '2 de septiembre de 2026',
        sections: [
          {
            heading: 'Qué es Groundswell',
            body: <>
              <p>Groundswell es un servicio de pronóstico de surf: condiciones en vivo y un pronóstico de olas de 10 días para cualquier spot de surf del planeta, además de más de 4 años de climatología histórica del oleaje. Cubre altura de ola, periodo y dirección del swell, viento, temperatura del agua, mareas e índice UV.</p>
              <p>La base de datos abarca más de 6.900 rompientes con nombre en todo el mundo. Groundswell es una aplicación web progresiva (PWA), está disponible en cinco idiomas y no muestra anuncios en ningún plan. Hay un nivel gratuito; las suscripciones de pago añaden alertas de swell y acceso ampliado al pronóstico.</p>
            </>,
          },
          {
            heading: 'De dónde vienen los datos del pronóstico',
            body: <>
              <p>Los pronósticos en vivo provienen de la API Marine de Open-Meteo, que ejecuta el modelo de oleaje ECMWF. Las mareas y el índice UV proceden de los modelos de mareas y atmosférico de Open-Meteo.</p>
              <p>La climatología histórica se basa en el reanálisis ERA5 (altura significativa de ola en mar abierto, Hs) del periodo 2022–2024. Todas las fuentes son de datos abiertos. La página de <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Precisión</a> explica los modelos y sus límites.</p>
            </>,
          },
          {
            heading: 'Cómo se calcula la valoración de surf',
            body: <>
              <p>Cada spot recibe una valoración compuesta que combina la altura del swell, el periodo y la dirección respecto a la orientación de la rompiente, junto con la velocidad y dirección del viento.</p>
              <p>No es una caja negra: la página de <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Precisión</a> detalla cómo se construye la valoración y publica el historial de aciertos de Groundswell frente a las condiciones observadas.</p>
            </>,
          },
          {
            heading: 'Quién está detrás de Groundswell',
            body: <>
              <p>Groundswell lo desarrolla y opera Kevin McCalley, un desarrollador independiente. No tiene financiación de capital riesgo ni inversores.</p>
              <p>Síguenos en <a href="https://www.instagram.com/ground.swell.surf/" rel="me" className="text-sky-400 hover:text-sky-300 transition-colors">Instagram</a>. ¿Comentarios o preguntas? Escribe a <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">Soporte</a>.</p>
            </>,
          },
        ],
      }
    case 'fr':
      return {
        title: 'À propos de Groundswell',
        subtitle: "Ce qu'est Groundswell, d'où viennent les données et qui le construit.",
        lastUpdated: '2 septembre 2026',
        sections: [
          {
            heading: "Ce qu'est Groundswell",
            body: <>
              <p>Groundswell est un service de prévision surf : conditions en direct et prévision de houle sur 10 jours pour n'importe quel spot du globe, plus de 4 ans de climatologie de houle. Il couvre la hauteur des vagues, la période et la direction de la houle, le vent, la température de l'eau, les marées et l'indice UV.</p>
              <p>La base de données recense plus de 6 900 spots nommés dans le monde. Groundswell est une application web progressive (PWA), disponible en cinq langues, et n'affiche aucune publicité, quel que soit le forfait. Une formule gratuite existe ; les abonnements payants ajoutent les alertes de houle et un accès étendu aux prévisions.</p>
            </>,
          },
          {
            heading: "D'où viennent les données de prévision",
            body: <>
              <p>Les prévisions en direct proviennent de l'API Marine d'Open-Meteo, qui fait tourner le modèle de vagues de l'ECMWF. Les marées et l'indice UV viennent des modèles de marées et atmosphérique d'Open-Meteo.</p>
              <p>La climatologie historique s'appuie sur la réanalyse ERA5 (hauteur significative des vagues au large, Hs) sur 2022–2024. Toutes les sources sont en données ouvertes. La page <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Précision</a> explique les modèles et leurs limites.</p>
            </>,
          },
          {
            heading: 'Comment la note de surf est calculée',
            body: <>
              <p>Chaque spot reçoit une note composite qui combine la hauteur de la houle, sa période et sa direction par rapport à l'orientation du spot, ainsi que la vitesse et la direction du vent.</p>
              <p>Ce n'est pas une boîte noire : la page <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Précision</a> détaille la construction de la note et publie l'historique de fiabilité de Groundswell face aux conditions observées.</p>
            </>,
          },
          {
            heading: 'Qui est derrière Groundswell',
            body: <>
              <p>Groundswell est développé et exploité par Kevin McCalley, développeur indépendant. Ni capital-risque, ni investisseurs.</p>
              <p>Suivez-nous sur <a href="https://www.instagram.com/ground.swell.surf/" rel="me" className="text-sky-400 hover:text-sky-300 transition-colors">Instagram</a>. Un retour ou une question ? Écrivez au <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">Support</a>.</p>
            </>,
          },
        ],
      }
    case 'pt-BR':
      return {
        title: 'Sobre o Groundswell',
        subtitle: 'O que é o Groundswell, de onde vêm os dados e quem faz.',
        lastUpdated: '2 de setembro de 2026',
        sections: [
          {
            heading: 'O que é o Groundswell',
            body: <>
              <p>O Groundswell é um serviço de previsão de surf: condições ao vivo e uma previsão de ondas de 10 dias para qualquer pico do planeta, além de mais de 4 anos de climatologia histórica de swell. Cobre altura de onda, período e direção do swell, vento, temperatura da água, marés e índice UV.</p>
              <p>O banco de dados reúne mais de 6.900 picos nomeados no mundo todo. O Groundswell é um aplicativo web progressivo (PWA), está disponível em cinco idiomas e não exibe anúncios em nenhum plano. Há um nível gratuito; as assinaturas pagas adicionam alertas de swell e acesso estendido à previsão.</p>
            </>,
          },
          {
            heading: 'De onde vêm os dados da previsão',
            body: <>
              <p>As previsões ao vivo vêm da API Marine da Open-Meteo, que roda o modelo de ondas do ECMWF. Marés e índice UV vêm dos modelos de marés e atmosférico da Open-Meteo.</p>
              <p>A climatologia histórica se baseia na reanálise ERA5 (altura significativa de onda em mar aberto, Hs) de 2022–2024. Todas as fontes são de dados abertos. A página de <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Precisão</a> explica os modelos e seus limites.</p>
            </>,
          },
          {
            heading: 'Como a nota de surf é calculada',
            body: <>
              <p>Cada pico recebe uma nota composta que combina a altura do swell, o período e a direção em relação à orientação da onda, junto com a velocidade e a direção do vento.</p>
              <p>Não é uma caixa-preta: a página de <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Precisão</a> detalha como a nota é construída e publica o histórico de acerto do Groundswell frente às condições observadas.</p>
            </>,
          },
          {
            heading: 'Quem está por trás do Groundswell',
            body: <>
              <p>O Groundswell é desenvolvido e operado por Kevin McCalley, um desenvolvedor independente. Sem capital de risco, sem investidores.</p>
              <p>Acompanhe no <a href="https://www.instagram.com/ground.swell.surf/" rel="me" className="text-sky-400 hover:text-sky-300 transition-colors">Instagram</a>. Comentários ou dúvidas? Escreva para o <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">Suporte</a>.</p>
            </>,
          },
        ],
      }
    case 'pt-PT':
      return {
        title: 'Sobre o Groundswell',
        subtitle: 'O que é o Groundswell, de onde vêm os dados e quem o faz.',
        lastUpdated: '2 de setembro de 2026',
        sections: [
          {
            heading: 'O que é o Groundswell',
            body: <>
              <p>O Groundswell é um serviço de previsão de surf: condições em direto e uma previsão de ondas a 10 dias para qualquer spot do planeta, além de mais de 4 anos de climatologia histórica de ondulação. Abrange altura de onda, período e direção da ondulação, vento, temperatura da água, marés e índice UV.</p>
              <p>A base de dados reúne mais de 6.900 spots com nome em todo o mundo. O Groundswell é uma aplicação web progressiva (PWA), está disponível em cinco idiomas e não mostra publicidade em nenhum plano. Existe um nível gratuito; as subscrições pagas acrescentam alertas de ondulação e acesso alargado à previsão.</p>
            </>,
          },
          {
            heading: 'De onde vêm os dados da previsão',
            body: <>
              <p>As previsões em direto vêm da API Marine da Open-Meteo, que corre o modelo de ondas do ECMWF. Marés e índice UV vêm dos modelos de marés e atmosférico da Open-Meteo.</p>
              <p>A climatologia histórica assenta na reanálise ERA5 (altura significativa de onda ao largo, Hs) de 2022–2024. Todas as fontes são de dados abertos. A página de <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Precisão</a> explica os modelos e os seus limites.</p>
            </>,
          },
          {
            heading: 'Como é calculada a classificação de surf',
            body: <>
              <p>Cada spot recebe uma classificação composta que combina a altura da ondulação, o período e a direção em relação à orientação da onda, juntamente com a velocidade e a direção do vento.</p>
              <p>Não é uma caixa negra: a página de <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Precisão</a> detalha como a classificação é construída e publica o histórico de acerto do Groundswell face às condições observadas.</p>
            </>,
          },
          {
            heading: 'Quem está por trás do Groundswell',
            body: <>
              <p>O Groundswell é desenvolvido e operado por Kevin McCalley, um programador independente. Sem capital de risco, sem investidores.</p>
              <p>Segue-nos no <a href="https://www.instagram.com/ground.swell.surf/" rel="me" className="text-sky-400 hover:text-sky-300 transition-colors">Instagram</a>. Comentários ou questões? Escreva para o <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">Suporte</a>.</p>
            </>,
          },
        ],
      }
    default:
      return {
        title: 'About Groundswell',
        subtitle: 'What Groundswell is, where the data comes from, and who builds it.',
        lastUpdated: 'September 2, 2026',
        sections: [
          {
            heading: 'What Groundswell is',
            body: <>
              <p>Groundswell is a surf-forecast service: live conditions and a 10-day wave forecast for any surf spot on earth, plus 4+ years of historical swell climatology. It covers wave height, swell period and direction, wind, water temperature, tides, and UV index.</p>
              <p>The spot database spans more than 6,900 named breaks worldwide. Groundswell is a progressive web app (PWA), is available in five languages, and shows no ads on any tier. There is a free tier; paid subscriptions add swell alerts and extended forecast access.</p>
            </>,
          },
          {
            heading: 'Where the forecast data comes from',
            body: <>
              <p>Live forecasts come from the Open-Meteo Marine API, which runs the ECMWF wave model. Tides and UV index come from Open-Meteo&rsquo;s tidal and atmospheric models.</p>
              <p>Historical climatology is built on ERA5 reanalysis (offshore significant wave height, Hs) for 2022–2024. Every source is open data. The <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Accuracy</a> page explains the models and their limits.</p>
            </>,
          },
          {
            heading: 'How the surf rating is calculated',
            body: <>
              <p>Each spot gets a composite rating that combines swell height, period, and direction against the break&rsquo;s orientation, together with wind speed and direction.</p>
              <p>It is not a black box: the <a href="/accuracy" className="text-sky-400 hover:text-sky-300 transition-colors">Accuracy</a> page breaks down how the rating is built and publishes Groundswell&rsquo;s track record against observed conditions.</p>
            </>,
          },
          {
            heading: 'Who is behind Groundswell',
            body: <>
              <p>Groundswell is built and operated by Kevin McCalley, an independent developer. No venture capital, no investors.</p>
              <p>Follow along on <a href="https://www.instagram.com/ground.swell.surf/" rel="me" className="text-sky-400 hover:text-sky-300 transition-colors">Instagram</a>. Feedback or questions? Write to <a href="/support" className="text-sky-400 hover:text-sky-300 transition-colors">Support</a>.</p>
            </>,
          },
        ],
      }
  }
}

export default function AboutContent() {
  const { locale } = useLanguage()
  const content = getContent(locale)
  return (
    <LegalPage
      title={content.title}
      subtitle={content.subtitle}
      lastUpdated={content.lastUpdated}
      sections={content.sections}
    />
  )
}
