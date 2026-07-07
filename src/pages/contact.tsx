import React, { useState } from "react"
import { PublicLayout } from "@/layouts/PublicLayout"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Mail, Phone, MapPin, CheckCircle2, MessageCircle } from "lucide-react"

interface ContactFormState {
  name: string
  email: string
  subject: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  message?: string
}

export default function Contact() {
  const [formData, setFormData] = useState<ContactFormState>({
    name: "",
    email: "",
    subject: "support",
    message: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = (): boolean => {
    const tempErrors: FormErrors = {}
    let isValid = true

    if (!formData.name.trim()) {
      tempErrors.name = "الاسم الكامل مطلوب."
      isValid = false
    }

    if (!formData.email.trim()) {
      tempErrors.email = "البريد الإلكتروني مطلوب."
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "البريد الإلكتروني غير صالح."
      isValid = false
    }

    if (!formData.message.trim()) {
      tempErrors.message = "نص الرسالة مطلوب."
      isValid = false
    } else if (formData.message.trim().length < 10) {
      tempErrors.message = "يجب أن تكون الرسالة من 10 أحرف على الأقل."
      isValid = false
    }

    setErrors(tempErrors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      const text = `*الاسم:* ${formData.name}\n*البريد الإلكتروني:* ${formData.email}\n*الموضوع:* ${formData.subject}\n*الرسالة:*\n${formData.message}`
      const encodedText = encodeURIComponent(text)
      window.open(`https://wa.me/601169397149?text=${encodedText}`, '_blank')
      
      setSubmitted(true)
      setFormData({
        name: "",
        email: "",
        subject: "support",
        message: "",
      })
      setErrors({})
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <PublicLayout>
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

              <div className="flex flex-col gap-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">البريد الإلكتروني للدعم</h4>
                    <span className="text-sm text-slate-600">support@feasibilitysuite.com</span>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">رقم الهاتف الرسمي</h4>
                    <span className="text-sm text-slate-600" dir="ltr">+966 11 000 0000</span>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">المقر الرئيسي للشركة</h4>
                    <span className="text-sm text-slate-600">طريق الملك فهد، الرياض، المملكة العربية السعودية</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Card className="hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center text-center gap-4 py-8 animate-fade-in">
                      <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                      <h3 className="text-xl font-bold text-slate-900">تم إرسال رسالتك بنجاح!</h3>
                      <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
                        شكراً لتواصلك معنا. سنقوم بمراجعة استفسارك والرد عليك عبر البريد الإلكتروني خلال 24 ساعة كحد أقصى.
                      </p>
                      <Button variant="primary" className="mt-4" onClick={() => setSubmitted(false)}>
                        إرسال رسالة أخرى
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-right">
                      <Input
                        label="الاسم الكامل"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="أحمد علي"
                      />

                      <Input
                        label="البريد الإلكتروني"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="example@domain.com"
                      />

                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-semibold text-slate-700">موضوع الاستفسار</label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                        >
                          <option value="support">دعم فني</option>
                          <option value="sales">اشتراك شركات</option>
                          <option value="partnership">شراكة تجارية</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-semibold text-slate-700">نص الرسالة</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="اكتب تفاصيل استفسارك هنا..."
                          rows={4}
                          className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all duration-150 ${
                            errors.message
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                          }`}
                        />
                        {errors.message && (
                          <span className="text-xs text-red-500 font-medium">{errors.message}</span>
                        )}
                      </div>

                      <Button type="submit" variant="primary" className="py-3 font-bold flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-[#25D366]/40 hover:shadow-xl hover:shadow-[#25D366]/50 transition-all duration-300 hover:-translate-y-1 active:scale-95">
                        <MessageCircle className="w-5 h-5" />
                        إرسال عبر واتساب
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
