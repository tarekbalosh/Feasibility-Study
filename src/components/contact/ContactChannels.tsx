import React from "react"
import { Mail, MapPin, Phone } from "lucide-react"

/** قنوات الاتصال الرسمية — مصدر واحد تقرأ منه صفحة التواصل والصفحة الرئيسية */
export const CONTACT_CHANNELS = [
  {
    icon: Mail,
    title: "البريد الإلكتروني للدعم",
    value: "support@feasibilitysuite.com",
    dir: "rtl" as const,
  },
  {
    icon: Phone,
    title: "رقم الهاتف الرسمي",
    value: "+601111111104",
    dir: "ltr" as const,
  },
  {
    icon: MapPin,
    title: "المقر الرئيسي للشركة",
    value: "Taman Putra Sulaiman, Selangor, 68000 Ampang.",
    dir: "rtl" as const,
  },
]

interface ContactChannelsProps {
  className?: string
}

export const ContactChannels: React.FC<ContactChannelsProps> = ({
  className = "",
}) => (
  <div className={`flex flex-col gap-6 ${className}`}>
    {CONTACT_CHANNELS.map((channel) => {
      const Icon = channel.icon
      return (
        <div key={channel.title} className="flex gap-4 items-start">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{channel.title}</h4>
            <span className="text-sm text-slate-600" dir={channel.dir}>
              {channel.value}
            </span>
          </div>
        </div>
      )
    })}
  </div>
)

export default ContactChannels
