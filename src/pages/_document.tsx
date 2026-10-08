import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="google-site-verification" content="4yuhJAOHqXg6Ygh9TeHCR-1pL03D1mnxfTJ-7_aSWO8" />
        {/* TODO: Re-add sameAs with real profile URLs inside Organization schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.corelogic-system.my/#organization",
                  "name": "CoreLogic Systems",
                  "url": "https://www.corelogic-system.my/",
                  "logo": "https://www.corelogic-system.my/corelogic_logo.png",
                  "email": "contact@corelogic-system.my",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Menara IQ, Tun Razak Exchange",
                    "addressLocality": "Kuala Lumpur",
                    "addressCountry": "MY"
                  }
                },
                {
                  "@type": "WebApplication",
                  "@id": "https://feasibilitysuite.com/#software",
                  "name": "Feasibility Suite",
                  "url": "https://feasibilitysuite.com",
                  "description": "منصة SaaS الذكية لإنشاء دراسات الجدوى بالذكاء الاصطناعي",
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "All",
                  "creator": {
                    "@id": "https://www.corelogic-system.my/#organization"
                  },
                  "publisher": {
                    "@id": "https://www.corelogic-system.my/#organization"
                  }
                }
              ]
            })
          }}
        />
      </Head>
      <body className="bg-slate-50 text-slate-900 font-cairo antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
