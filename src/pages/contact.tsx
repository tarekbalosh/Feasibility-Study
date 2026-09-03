import React from "react"
import Head from "next/head"
import { PublicLayout } from "@/layouts/PublicLayout"
import { ContactForm } from "@/components/contact/ContactForm"
import { ContactChannels } from "@/components/contact/ContactChannels"

export default function Contact() {
  return (
    <PublicLayout>
      <Head>
        <title>تواصل معنا | Feasibility Suite</title>
        <meta
          name="description"
          content="تواصل مع فريق Feasibility Suite للدعم الفني أو الاشتراكات المؤسسية أو الشراكات التجارية."
        />
      </Head>

      {/* Header Section */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">تواصل معنا</h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            هل لديك أي استفسار أو اقتراح؟ يسعدنا سماع صوتك والتواصل معنا في أي وقت.
          </p>
        </div>
      </section>

      {/* Main Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="flex flex-col gap-8 text-right animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl font-bold text-slate-900">معلومات الاتصال المباشرة</h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  تواصل معنا مباشرة عبر إحدى قنوات الدعم الرسمية، أو قم بزيارة مقرنا الرئيسي.
                </p>
              </div>

              <ContactChannels />
            </div>

            {/* Contact Form */}
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
