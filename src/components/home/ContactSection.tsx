import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ContactChannels } from "@/components/contact/ContactChannels"
import { ContactForm } from "@/components/contact/ContactForm"

export const ContactSection: React.FC = () => (
  <section id="contact" className="py-20 bg-white scroll-mt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* القنوات */}
        <div className="flex flex-col gap-8 text-right">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              تواصل معنا
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              سؤال عن أداة؟ أو أداة تتمنّى وجودها؟
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              اقتراحات المستخدمين هي ما يحدّد الأداة التالية على خارطة الطريق.
              راسلنا مباشرة عبر أي من قنوات الدعم الرسمية، أو من النموذج المجاور.
            </p>
          </div>

          <ContactChannels />

          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-150"
          >
            صفحة التواصل الكاملة
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* النموذج */}
        <ContactForm />
      </div>
    </div>
  </section>
)

export default ContactSection
