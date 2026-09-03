import React from "react"
import Head from "next/head"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowDown,
  BrainCircuit,
  Building2,
  CheckCircle2,
  FileDown,
  GraduationCap,
  Grid2x2,
  Globe2,
  Pencil,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { PublicLayout } from "@/layouts/PublicLayout"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { getToolStartPath } from "@/config/tools.registry"

/**
 * صفحة أداة تحليل SWOT (Landing).
 * تتبع نفس بنية وتصميم صفحة أداة دراسة الجدوى:
 * Hero + المميزات + خطوات العمل + CTA.
 */
const START_PATH = getToolStartPath("swot")

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "مصفوفة رباعية بالذكاء الاصطناعي",
    description:
      "يقرأ المحرك وصف مشروعك وقطاعه ومرحلته، ثم يفصل ما تملكه فعلاً (قوة وضعف) عمّا يحيط بك في السوق (فرص وتهديدات) — وهو الخطأ الأشيع في تحليلات SWOT اليدوية.",
  },
  {
    icon: Target,
    title: "استراتيجيات من التقاطعات",
    description:
      "قيمة التحليل ليست في الأرباع بل في تقاطعها. نستخرج لك أربع حزم استراتيجية: هجومية، تطويرية، دفاعية، وانكفائية — كل واحدة قابلة للتنفيذ لا للتأمّل.",
  },
  {
    icon: Pencil,
    title: "بنود قابلة للتحرير والطباعة",
    description:
      "التحليل نقطة انطلاق لا حكم نهائي: عدّل أي بند، أضف ما تعرفه عن سوقك، احذف ما لا ينطبق، ثم اطبع النتيجة أو صدّرها PDF لعرضها على شركائك.",
  },
]

const STEPS = [
  {
    number: "01",
    title: "اختر قطاعك ومرحلة مشروعك",
    description:
      "قطاع المشروع يحدّد العوامل التي تُقاس عليها المصفوفة، ومرحلته (فكرة، قائم، توسّع) تغيّر زاوية التحليل بالكامل.",
  },
  {
    number: "02",
    title: "صِف مشروعك بجملتين أو ثلاث",
    description:
      "ماذا يقدّم مشروعك، ما موارده الحالية، ومن فئته المستهدفة. كل تفصيل تضيفه يرفع دقة التحليل — والمنافسون حقل اختياري يستحق التعبئة.",
  },
  {
    number: "03",
    title: "استلم مصفوفتك واستراتيجياتك",
    description:
      "مصفوفة رباعية كاملة، حزم استراتيجية من تقاطعاتها، وملخص تنفيذي لموقعك — جاهزة للتحرير والطباعة خلال ثوانٍ.",
  },
]

const QUADRANT_PREVIEW = [
  {
    letter: "S",
    title: "نقاط القوة",
    hint: "داخلي — لصالحك",
    icon: TrendingUp,
    chip: "bg-emerald-600",
    box: "bg-emerald-50 border-emerald-100 text-emerald-800",
  },
  {
    letter: "W",
    title: "نقاط الضعف",
    hint: "داخلي — يحتاج معالجة",
    icon: TrendingDown,
    chip: "bg-rose-600",
    box: "bg-rose-50 border-rose-100 text-rose-800",
  },
  {
    letter: "O",
    title: "الفرص",
    hint: "خارجي — يمكن اقتناصه",
    icon: Target,
    chip: "bg-sky-600",
    box: "bg-sky-50 border-sky-100 text-sky-800",
  },
  {
    letter: "T",
    title: "التهديدات",
    hint: "خارجي — يجب التحوّط له",
    icon: AlertTriangle,
    chip: "bg-amber-600",
    box: "bg-amber-50 border-amber-100 text-amber-800",
  },
]

/** لماذا تحتاج التحليل الرباعي — القيمة العملية للأداة */
const WHY_SWOT = [
  {
    title: "أقصى استفادة ممّا تملك",
    description:
      "تعرف مواردك ومزاياك الحقيقية بدقّة، فتبني عليها بدل أن تبحث عمّا لا تملكه.",
  },
  {
    title: "تقليل فرص الفشل",
    description:
      "فهم ما تفتقر إليه مبكراً أرخص بكثير من اكتشافه بعد إنفاق رأس المال.",
  },
  {
    title: "لا مفاجآت من السوق",
    description:
      "المخاطر المحسوبة تفقد نصف خطرها — والتحليل يضعها أمامك قبل أن تفاجئك.",
  },
  {
    title: "أهداف واضحة قابلة للقياس",
    description:
      "منطلق مباشر للتخطيط الاستراتيجي والتشغيلي وخطط تطوير العمل.",
  },
]

/** تركيب المصفوفة: تحليل داخلي + تحليل خارجي = SWOT */
const COMPOSITION = [
  {
    title: "تحليل المنشأة",
    focus: "تركيز داخلي — ما تملكه وما ينقصك",
    icon: Building2,
    iconBox: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    items: [
      {
        letter: "S",
        label: "نقاط القوة",
        box: "bg-emerald-50 border-emerald-100 text-emerald-800",
      },
      {
        letter: "W",
        label: "نقاط الضعف",
        box: "bg-rose-50 border-rose-100 text-rose-800",
      },
    ],
  },
  {
    title: "تحليل السوق",
    focus: "تركيز خارجي — ما يحيط بمشروعك",
    icon: Globe2,
    iconBox: "bg-sky-50 text-sky-600 border border-sky-100",
    items: [
      {
        letter: "O",
        label: "الفرص",
        box: "bg-sky-50 border-sky-100 text-sky-800",
      },
      {
        letter: "T",
        label: "التهديدات",
        box: "bg-amber-50 border-amber-100 text-amber-800",
      },
    ],
  },
]

export default function SwotLanding() {
  return (
    <PublicLayout>
      <Head>
        <title>أداة تحليل SWOT الذكية | Feasibility Suite</title>
        <meta
          name="description"
          content="ما هو تحليل SWOT (التحليل الرباعي / مصفوفة سوات)؟ وأنشئ مصفوفتك الرباعية بالذكاء الاصطناعي: نقاط القوة والضعف والفرص والتهديدات، مع استراتيجيات عملية مستخرجة من تقاطعات المصفوفة — مجاناً وبلا تسجيل."
        />
        <link rel="canonical" href="https://feasibilitysuite.com/tools/swot" />
      </Head>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-b from-sky-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="flex flex-col items-start gap-6 text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                🧭 تحليل استراتيجي بالذكاء الاصطناعي
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                اعرف موقع مشروعك الحقيقي في{" "}
                <span className="text-sky-600">تحليل واحد</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                نقاط قوتك، مواضع ضعفك، الفرص المتاحة أمامك، والتهديدات المحيطة
                بك — مصفوفة SWOT رباعية مبنية على قطاع مشروعك ومرحلته، ومرفقة
                باستراتيجيات عملية مستخرجة من تقاطعاتها.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href={START_PATH} passHref>
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto text-base px-8 py-3 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500"
                  >
                    ابدأ تحليلك مجاناً
                  </Button>
                </Link>
                <Link href="/tools" passHref>
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto text-base border border-slate-200 bg-white hover:bg-slate-50 px-8 py-3"
                  >
                    استعرض بقية الأدوات
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-slate-400">
                بلا تسجيل، وبلا بطاقة دفع — التحليل يبدأ مباشرةً.
              </p>
            </div>

            {/* Visual Panel — لمحة من المصفوفة */}
            <div className="relative flex justify-center">
              <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-100/50 p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    المصفوفة الرباعية
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {QUADRANT_PREVIEW.map((quadrant) => {
                    const Icon = quadrant.icon
                    return (
                      <div
                        key={quadrant.letter}
                        className={`p-4 border rounded-xl flex flex-col gap-2 ${quadrant.box}`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`w-7 h-7 rounded-lg text-white text-sm font-black flex items-center justify-center ${quadrant.chip}`}
                          >
                            {quadrant.letter}
                          </span>
                          <Icon className="w-4 h-4 opacity-60" />
                        </div>
                        <span className="text-sm font-bold">{quadrant.title}</span>
                        <span className="text-[11px] opacity-75">
                          {quadrant.hint}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ما هو تحليل SWOT؟ — تعريف الأداة */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              تعريف الأداة
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              ما هو تحليل SWOT؟
            </h2>
            <p className="text-slate-600 leading-relaxed">
              يُسمّى أيضاً «التحليل الرباعي» أو «مصفوفة سوات»، وهو أداة تساعدك
              على صياغة استراتيجية مشروعك انطلاقاً من أربعة جوانب فقط.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* الشرح النصّي */}
            <div className="flex flex-col gap-5 text-right">
              <p className="text-slate-600 leading-relaxed">
                الاسم اختصار لأربع كلمات: نقاط القوة{" "}
                <span className="font-semibold text-slate-700">Strengths</span>،
                نقاط الضعف{" "}
                <span className="font-semibold text-slate-700">Weaknesses</span>،
                الفرص{" "}
                <span className="font-semibold text-slate-700">
                  Opportunities
                </span>
                ، والتهديدات{" "}
                <span className="font-semibold text-slate-700">Threats</span> —
                وتحليل SWOT هو أسلوب لتقييم هذه الجوانب الأربعة في عملك.
              </p>
              <p className="text-slate-600 leading-relaxed">
                هو منطلق رئيسي لاستكشاف أهداف مشروعك وتحديدها، ولذلك يُعدّ جزءاً
                أساسياً من التخطيط الاستراتيجي والتخطيط التشغيلي وتطوير الأعمال،
                وواحدة من أهم الأدوات التي تستخدمها الشركات والفرق لاكتشاف
                أهدافها.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {WHY_SWOT.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60"
                  >
                    <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-900">
                        {item.title}
                      </span>
                      <span className="text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* نشأة الأداة */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50/70 border border-sky-100">
                <GraduationCap className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <p className="text-xs text-sky-900/80 leading-relaxed">
                  ابتكر هذا التحليل عام 1965 أربعة باحثين من كلية هارفارد
                  للأعمال: ليرند (Learned)، وكريستنسن (Christensen)، وأندروز
                  (Andrews)، وجوث (Guth) — ولذلك يُعرف أيضاً بنموذج «إل سي إيه
                  جي» (LCAG Model) نسبةً إلى الحروف الأولى من أسمائهم.
                </p>
              </div>
            </div>

            {/* كيف تُبنى المصفوفة — تركيز داخلي + تركيز خارجي */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-right">
                <h3 className="text-lg font-bold text-slate-900">
                  كيف تُبنى المصفوفة؟
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  تُحلَّل نقاط قوة المشروع وضعفه من الداخل، ويُحلَّل السوق من
                  الخارج، ثم يُجمع التحليلان معاً لتنتج مصفوفة SWOT.
                </p>
              </div>

              {COMPOSITION.map((block, index) => {
                const Icon = block.icon
                return (
                  <React.Fragment key={block.title}>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${block.iconBox}`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">
                            {block.title}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {block.focus}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {block.items.map((item) => (
                          <div
                            key={item.letter}
                            className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${item.box}`}
                          >
                            <span className="text-xs font-black">
                              {item.letter}
                            </span>
                            <span className="text-xs font-semibold">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="flex items-center justify-center">
                        <span className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 text-sm font-bold flex items-center justify-center">
                          +
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                )
              })}

              <div className="flex items-center justify-center">
                <ArrowDown className="w-5 h-5 text-slate-400" />
              </div>

              <div className="rounded-xl bg-sky-900 text-white p-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Grid2x2 className="w-4 h-4" />
                </span>
                <div className="flex flex-col text-right">
                  <span className="text-sm font-bold">مصفوفة SWOT</span>
                  <span className="text-[11px] text-sky-200 leading-relaxed">
                    أربعة أرباع مكتملة، وأربع حزم استراتيجية مستخرجة من
                    تقاطعاتها.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-slate-900">
              ما يميّز تحليل SWOT على المنصة؟
            </h2>
            <p className="text-slate-600">
              معظم تحليلات SWOT تنتهي كأربع قوائم معلّقة على الحائط. هذه الأداة
              مبنية لتخرج منها بقرارات.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="w-12 h-12 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* خطوات العمل */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              خطوات العمل
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              ثلاث خطوات، وأقل من أربع دقائق
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-3"
              >
                <span className="w-10 h-10 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center">
                  {step.number}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* الأسعار */}
          <div className="mt-14 max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <FileDown className="w-7 h-7" />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-lg font-bold text-slate-900">
                الأداة مجانية بالكامل حالياً
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                تحليل غير محدود، تحرير للبنود، وطباعة أو تصدير PDF — بلا تسجيل
                ولا بطاقة دفع. سنعلن عن أي خطط مدفوعة مسبقاً قبل تطبيقها.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sky-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-800 via-sky-950 to-slate-950 opacity-90" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            أين يقف مشروعك الآن؟
          </h2>
          <p className="text-sky-200 max-w-xl text-base leading-relaxed">
            صِف مشروعك في سطرين، واحصل على مصفوفة SWOT كاملة واستراتيجياتها خلال
            ثوانٍ — مجاناً وبلا تسجيل.
          </p>
          <Link href={START_PATH} passHref>
            <Button
              variant="secondary"
              className="px-8 py-3 text-base font-bold shadow-lg shadow-emerald-950/20"
            >
              ابدأ تحليلك مجاناً
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
