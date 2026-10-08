import React from "react"
import Head from "next/head"
import { PublicLayout } from "@/layouts/PublicLayout"

export default function AboutPlatform() {
  return (
    <PublicLayout>
      <Head>
        <title>About the Platform | Feasibility Suite</title>
        <meta
          name="description"
          content="Learn about how Feasibility Suite was developed, the results it drives, and the team behind this platform."
        />
        <link rel="canonical" href="https://feasibilitysuite.com/about-platform" />
        <meta property="og:title" content="About the Platform | Feasibility Suite" />
        <meta
          property="og:description"
          content="Learn about how Feasibility Suite was developed, the results it drives, and the team behind this platform."
        />
        <meta property="og:url" content="https://feasibilitysuite.com/about-platform" />
        <meta property="og:type" content="article" />
        <meta name="author" content="CoreLogic Systems" />
        <link rel="author" href="https://www.corelogic-system.my/" />
      </Head>

      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">About Feasibility Suite</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">What This Platform Does</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Feasibility Suite is an intelligent, AI-driven SaaS platform designed specifically for Arab entrepreneurs, startups, and established businesses. Our goal is to streamline the complex process of creating comprehensive feasibility studies, conducting strategic SWOT analyses, and formulating reliable financial projections. 
              By leveraging cutting-edge automation, what used to take weeks of consulting now takes only minutes, enabling faster and more confident decision-making.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Who Built It</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              This platform was architected and developed by CoreLogic Systems, a leading software engineering firm specializing in enterprise-grade SaaS and data-driven web applications. 
              With a deep focus on performance, scalability, and user experience. 
              If your organization is looking to build similar high-performance digital products, you can explore our <a href="https://www.corelogic-system.my/services" target="_blank" rel="noopener" className="text-indigo-600 hover:text-indigo-800 underline transition-colors">custom software development services</a> to learn how we can accelerate your next initiative.
            </p>
          </section>

          {/* TODO: Re-add metrics section only with real data */}
        </div>
      </div>
    </PublicLayout>
  )
}
