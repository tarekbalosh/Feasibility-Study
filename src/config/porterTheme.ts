import {
  UserPlus,
  Users,
  Truck,
  Shuffle,
  Swords,
  Compass,
  ShieldCheck,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";
import type { PorterForceKey, PorterFieldKey } from "@/types/porter";

export interface ForceTheme {
  key: PorterForceKey;
  order: number;
  title: string;
  englishLabel: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  gradientLight: string;
  border: string;
  borderGlow: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  headerBg: string;
}

export const PORTER_FORCE_THEMES: Record<PorterForceKey, ForceTheme> = {
  newEntrants: {
    key: "newEntrants",
    order: 1,
    title: "المنافسون الجدد",
    englishLabel: "NEW ENTRANTS",
    subtitle: "حواجز الدخول، سهولة تأسيس مشاريع منافسة، والتشريعات المنظمة للقطاع",
    icon: UserPlus,
    gradient: "from-emerald-600 via-teal-600 to-emerald-700",
    gradientLight: "from-emerald-500/10 via-teal-500/5 to-transparent",
    border: "border-emerald-200/80 hover:border-emerald-300",
    borderGlow: "shadow-emerald-500/10",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25",
    iconColor: "text-emerald-600",
    accentColor: "text-emerald-600",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "text-emerald-700",
    headerBg: "bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white",
  },
  buyers: {
    key: "buyers",
    order: 2,
    title: "العملاء والجمهور",
    englishLabel: "BUYERS & CUSTOMERS",
    subtitle: "القوة التفاوضية للعملاء، حساسية الأسعار، وتكلفة الانتقال لمنافس آخر",
    icon: Users,
    gradient: "from-blue-600 via-cyan-600 to-blue-700",
    gradientLight: "from-blue-500/10 via-cyan-500/5 to-transparent",
    border: "border-blue-200/80 hover:border-blue-300",
    borderGlow: "shadow-blue-500/10",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-blue-500/25",
    iconColor: "text-blue-600",
    accentColor: "text-blue-600",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeText: "text-blue-700",
    headerBg: "bg-gradient-to-r from-blue-50/90 via-cyan-50/50 to-white",
  },
  suppliers: {
    key: "suppliers",
    order: 3,
    title: "مزودو الخدمة والموردون",
    englishLabel: "SUPPLIERS",
    subtitle: "تركّز الموردين، قدرتهم على التحكم بالأسعار وجودة المدخلات وسلاسل الإمداد",
    icon: Truck,
    gradient: "from-amber-500 via-orange-500 to-amber-600",
    gradientLight: "from-amber-500/10 via-orange-500/5 to-transparent",
    border: "border-amber-200/80 hover:border-amber-300",
    borderGlow: "shadow-amber-500/10",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25",
    iconColor: "text-amber-600",
    accentColor: "text-amber-600",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    badgeText: "text-amber-800",
    headerBg: "bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white",
  },
  substitutes: {
    key: "substitutes",
    order: 4,
    title: "المنتجات البديلة",
    englishLabel: "SUBSTITUTES",
    subtitle: "توفر حلول وبدائل رقمية أو تقليدية تلبي نفس الحاجة بتكلفة أو مجهود أقل",
    icon: Shuffle,
    gradient: "from-purple-600 via-indigo-600 to-purple-700",
    gradientLight: "from-purple-500/10 via-indigo-500/5 to-transparent",
    border: "border-purple-200/80 hover:border-purple-300",
    borderGlow: "shadow-purple-500/10",
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/25",
    iconColor: "text-purple-600",
    accentColor: "text-purple-600",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    badgeText: "text-purple-700",
    headerBg: "bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-white",
  },
  rivalry: {
    key: "rivalry",
    order: 5,
    title: "المنافسة الحالية",
    englishLabel: "INDUSTRY RIVALRY",
    subtitle: "شدة المنافسة بين اللاعبين القائمين، حروب الأسعار، وحجم النمو الكلي للسوق",
    icon: Swords,
    gradient: "from-rose-600 via-red-600 to-rose-700",
    gradientLight: "from-rose-500/10 via-red-500/5 to-transparent",
    border: "border-rose-200/80 hover:border-rose-300",
    borderGlow: "shadow-rose-500/10",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25",
    iconColor: "text-rose-600",
    accentColor: "text-rose-600",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    badgeText: "text-rose-700",
    headerBg: "bg-gradient-to-r from-rose-50/90 via-red-50/50 to-white",
  },
};

export interface PorterCategoryTheme {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  headerBg: string;
  accentColor: string;
  emptyText: string;
}

export const PORTER_CATEGORY_THEMES: Record<PorterFieldKey, PorterCategoryTheme> = {
  trends: {
    title: "أبرز التوجهات والمؤشرات",
    subtitle: "العوامل والمسارات العامة في البيئة التنافسية",
    icon: Compass,
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    badgeText: "text-sky-700",
    borderColor: "border-sky-200/70",
    headerBg: "bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-white",
    accentColor: "text-sky-600",
    emptyText: "لا توجد مؤشرات مسجلة حتى الآن في هذا المسار.",
  },
  positiveImpacts: {
    title: "الانعكاسات الإيجابية والفرص",
    subtitle: "الفرص المحتملة والمكاسب الاستراتيجية للمشروع",
    icon: ShieldCheck,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "text-emerald-700",
    borderColor: "border-emerald-200/70",
    headerBg: "bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white",
    accentColor: "text-emerald-600",
    emptyText: "لا توجد انعكاسات إيجابية مسجلة حالياً.",
  },
  negativeImpacts: {
    title: "الانعكاسات السلبية والمخاطر",
    subtitle: "التحديات والمخاطر المحتملة التي تستوجب التحوط",
    icon: AlertTriangle,
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    badgeText: "text-rose-700",
    borderColor: "border-rose-200/70",
    headerBg: "bg-gradient-to-r from-rose-50/80 via-orange-50/40 to-white",
    accentColor: "text-rose-600",
    emptyText: "لا توجد انعكاسات سلبية مسجلة حالياً.",
  },
};
