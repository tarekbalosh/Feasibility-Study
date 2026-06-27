import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { AuthProvider } from "@/context/AuthContext"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
