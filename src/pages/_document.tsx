import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="منصة SaaS الذكية لإنشاء دراسات الجدوى بالذكاء الاصطناعي" />
      </Head>
      <body className="bg-slate-50 text-slate-900 font-cairo antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
