import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="منصة SaaS الذكية لإنشاء دراسات الجدوى بالذكاء الاصطناعي" />
        <meta name="google-site-verification" content="4yuhJAOHqXg6Ygh9TeHCR-1pL03D1mnxfTJ-7_aSWO8" />
      </Head>
      <body className="bg-slate-50 text-slate-900 font-cairo antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
