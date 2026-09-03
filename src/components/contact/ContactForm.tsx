import React, { useState } from "react"
import { CheckCircle2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"

/** رقم واتساب الدعم — الرسائل تُرسل عبره */
const SUPPORT_WHATSAPP = "601111111104"

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

const emptyForm: ContactFormState = {
  name: "",
  email: "",
  subject: "support",
  message: "",
}

interface ContactFormProps {
  className?: string
}

/**
 * نموذج التواصل — مشترك بين صفحة "تواصل معنا" وقسم التواصل
 * في الصفحة الرئيسية، حتى لا يُكرَّر منطق التحقق والإرسال مرتين.
 */
export const ContactForm: React.FC<ContactFormProps> = ({ className = "" }) => {
  const [formData, setFormData] = useState<ContactFormState>(emptyForm)
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
    if (!validate()) return

    const text = `*الاسم:* ${formData.name}\n*البريد الإلكتروني:* ${formData.email}\n*الموضوع:* ${formData.subject}\n*الرسالة:*\n${formData.message}`
    window.open(
      `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`,
      "_blank"
    )

    setSubmitted(true)
    setFormData(emptyForm)
    setErrors({})
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card className={`hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <CardContent className="p-8">
        {submitted ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 py-8 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <h3 className="text-xl font-bold text-slate-900">
              تم إرسال رسالتك بنجاح!
            </h3>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              شكراً لتواصلك معنا. سنقوم بمراجعة استفسارك والرد عليك عبر البريد
              الإلكتروني خلال 24 ساعة كحد أقصى.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => setSubmitted(false)}
            >
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
              <label className="text-sm font-semibold text-slate-700">
                موضوع الاستفسار
              </label>
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
              <label className="text-sm font-semibold text-slate-700">
                نص الرسالة
              </label>
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
                <span className="text-xs text-red-500 font-medium">
                  {errors.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="py-3 font-bold flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-[#25D366]/40 hover:shadow-xl hover:shadow-[#25D366]/50 transition-all duration-300 hover:-translate-y-1 active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              إرسال عبر واتساب
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default ContactForm
