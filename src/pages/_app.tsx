import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { AuthProvider } from "@/context/AuthContext"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import Script from "next/script"

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
        <Script id="tawk-to-script" strategy="afterInteractive">
          {`
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/6a4ccb7a539b7e1d4b7d507c/1jstvllp8';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `}
        </Script>
      </AuthProvider>
    </QueryClientProvider>
  )
}
