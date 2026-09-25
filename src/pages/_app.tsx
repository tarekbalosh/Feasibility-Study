import "@/styles/globals.css"
import type { AppProps } from "next/app"
import Head from "next/head"
import { AuthProvider } from "@/context/AuthContext"
import { WorkspaceProvider } from "@/context/WorkspaceContext"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from "react-hot-toast"

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }))

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
        {/* حالة مساحة العمل تعتمد على الجلسة، فتُركَّب داخل AuthProvider */}
        <WorkspaceProvider>
          <Component {...pageProps} />
        </WorkspaceProvider>
        {/* التنبيهات المنبثقة — تستهلكها الخدمات والهوكس عبر toast.* */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily: "Cairo, sans-serif", direction: "rtl" },
            duration: 4000,
          }}
        />

      </AuthProvider>
    </QueryClientProvider>
    </>
  )
}
