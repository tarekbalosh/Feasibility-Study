import React from "react"
import Link from "next/link"
import clsx from "clsx"
import { Crown, Info, Lock, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  countDetailedItems,
  swotDetailedLists,
} from "@/config/swotDetailedLists"
import { usePlanAccess } from "@/hooks/usePlanAccess"
import type { SwotQuadrantKey } from "@/types/swot"

/**
 * ─────────────────────────────────────────────────────────────
 *  القوائم التفصيلية — ميزة مدفوعة
 * ─────────────────────────────────────────────────────────────
 *  زرّ صغير بجوار ترويسة كل ربع يفتح نافذة تعرض تصنيفاً معمّقاً
 *  لذلك الربع بأمثلة جاهزة.
 *
 *  القفل يخصّ محتوى هذه النافذة وحدها: بقية الأداة — الاختيار
 *  والإضافة والحذف والتوليد — تبقى مفتوحة للجميع.
 *
 *  للمستخدم المجاني تُفتح النافذة نفسها بهيكلها كاملاً (العناوين
 *  والفئات) لكن الأمثلة تُستبدل بأشرطة مموّهة — فلا تُرسَل نصوصها
 *  إلى المتصفح أصلاً، ولا يُتجاوز القفل بتعطيل تمويه في أدوات
 *  المطوّر.
 * ─────────────────────────────────────────────────────────────
 */

/** ألوان الربع — تصل من شاشة الاختيار فلا تُكرَّر خريطة الألوان هنا */
export interface QuadrantAccent {
  letter: string
  title: string
  /** خلفية شارة الحرف — مثل bg-emerald-600 */
  badge: string
  /** خلفية الترويسة وحدّها */
  header: string
  /** لون نص مميّز للربع */
  text: string
}

const ar = (value: number): string => value.toLocaleString("ar-EG")

/** عروض ثابتة لأشرطة المحتوى المموّه — قيم ثابتة تفادياً لاختلاف الترطيب */
const BLUR_WIDTHS = ["92%", "78%", "85%", "70%", "88%", "74%"]

// ─────────────────────────────────────────────────────────────
//  الزرّ
// ─────────────────────────────────────────────────────────────

interface DetailedListsButtonProps {
  accent: QuadrantAccent
  isPro: boolean
  onClick: () => void
}

const DetailedListsButton: React.FC<DetailedListsButtonProps> = ({
  accent,
  isPro,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={`القوائم التفصيلية لـ${accent.title}`}
    aria-label={`القوائم التفصيلية لـ${accent.title}${isPro ? "" : " — ميزة مدفوعة"}`}
    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-white/80 bg-white/80 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-colors duration-150"
  >
    <Info className="w-3.5 h-3.5 shrink-0" />
    <span className="whitespace-nowrap">القوائم التفصيلية</span>
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-black leading-none",
        isPro
          ? "bg-amber-100 text-amber-700"
          : "bg-amber-500 text-white shadow-sm"
      )}
    >
      {!isPro && <Lock className="w-2.5 h-2.5" strokeWidth={3} />}
      Pro
    </span>
  </button>
)

// ─────────────────────────────────────────────────────────────
//  محتوى النافذة — المفتوح والمقفل
// ─────────────────────────────────────────────────────────────

const UnlockedContent: React.FC<{ category: SwotQuadrantKey; accent: QuadrantAccent }> = ({
  category,
  accent,
}) => {
  const list = swotDetailedLists[category]

  return (
    <div className="flex flex-col gap-4">
      {list.groups.map((group, index) => (
        <section
          key={group.id}
          className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
        >
          <header
            className={clsx(
              "flex items-start gap-3 px-4 py-3 border-b border-slate-100",
              accent.header
            )}
          >
            <span
              className={clsx(
                "w-7 h-7 shrink-0 rounded-lg text-white text-xs font-black flex items-center justify-center",
                accent.badge
              )}
            >
              {ar(index + 1)}
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {group.description}
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 px-4 py-4">
            {group.subgroups.map((subgroup) => (
              <div key={subgroup.title} className="flex flex-col gap-1.5">
                <h4
                  className={clsx(
                    "text-[12px] font-bold flex items-center gap-1.5",
                    accent.text
                  )}
                >
                  <span className="w-1 h-3.5 rounded-full bg-current opacity-60" />
                  {subgroup.title}
                </h4>
                <ul className="flex flex-col gap-1 pr-3">
                  {subgroup.items.map((item) => (
                    <li
                      key={item}
                      className="relative text-[12.5px] text-slate-600 leading-relaxed before:absolute before:-right-3 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-slate-300"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * الهيكل نفسه بلا نصوص الأمثلة — عناوين المجموعات والفئات فقط،
 * والبنود أشرطة رمادية. مموّه بصرياً وفارغ فعلياً.
 */
const LockedPreview: React.FC<{ category: SwotQuadrantKey; accent: QuadrantAccent }> = ({
  category,
  accent,
}) => {
  const list = swotDetailedLists[category]

  return (
    <div
      className="flex flex-col gap-4 blur-[5px] select-none pointer-events-none"
      aria-hidden="true"
    >
      {list.groups.map((group, index) => (
        <section
          key={group.id}
          className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
        >
          <header
            className={clsx(
              "flex items-start gap-3 px-4 py-3 border-b border-slate-100",
              accent.header
            )}
          >
            <span
              className={clsx(
                "w-7 h-7 shrink-0 rounded-lg text-white text-xs font-black flex items-center justify-center",
                accent.badge
              )}
            >
              {ar(index + 1)}
            </span>
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
              <span className="block h-2 rounded-full bg-slate-200 w-3/4" />
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 px-4 py-4">
            {group.subgroups.map((subgroup) => (
              <div key={subgroup.title} className="flex flex-col gap-2">
                <h4
                  className={clsx(
                    "text-[12px] font-bold flex items-center gap-1.5",
                    accent.text
                  )}
                >
                  <span className="w-1 h-3.5 rounded-full bg-current opacity-60" />
                  {subgroup.title}
                </h4>
                <div className="flex flex-col gap-1.5 pr-3">
                  {subgroup.items.map((_, itemIndex) => (
                    <span
                      key={itemIndex}
                      className="block h-2.5 rounded-full bg-slate-200"
                      style={{
                        width: BLUR_WIDTHS[itemIndex % BLUR_WIDTHS.length],
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** لوحة القفل الثابتة فوق المحتوى المموّه */
const PaywallOverlay: React.FC<{
  category: SwotQuadrantKey
  upgradePath: string
  isGuest: boolean
}> = ({ category, upgradePath, isGuest }) => (
  <div className="absolute inset-0 z-10 flex items-start justify-center px-2 py-6 sm:py-12">
    <div className="sticky top-0 w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-xl px-6 py-7 flex flex-col items-center gap-4 text-center">
      <span className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
        <Lock className="w-7 h-7" />
      </span>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-slate-900">
          🔒 هذه الخدمة غير متاحة في الخطة المجانية
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          القوائم التفصيلية تمنحك تصنيفاً معمقاً لكل عنصر SWOT مع أمثلة جاهزة
          تسهّل عليك تعبئة التحليل بدقة احترافية.
        </p>
        <p className="text-[12px] text-slate-400">
          {ar(countDetailedItems(category))} مثالاً جاهزاً في هذا القسم وحده،
          موزّعة على {ar(swotDetailedLists[category].groups.length)} مجموعات
          مصنّفة.
        </p>
      </div>

      <Link href={upgradePath} passHref className="w-full">
        <Button
          type="button"
          variant="primary"
          className="w-full py-2.5 text-sm font-bold gap-2 bg-amber-500 hover:bg-amber-600 focus:ring-amber-400"
        >
          <Crown className="w-4 h-4" />
          ترقية الحساب — عرض الخطط
        </Button>
      </Link>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        {isGuest ? (
          <>
            مشترك بالفعل؟{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-sky-600 hover:text-sky-700"
            >
              سجّل الدخول
            </Link>{" "}
            لفتح القوائم.
          </>
        ) : (
          "بقية الأداة تعمل كالمعتاد — الاختيار والإضافة وتوليد التحليل مجاناً."
        )}
      </p>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────
//  النافذة
// ─────────────────────────────────────────────────────────────

interface DetailedListsModalProps {
  category: SwotQuadrantKey
  accent: QuadrantAccent
  isPro: boolean
  isGuest: boolean
  upgradePath: string
  onClose: () => void
}

const DetailedListsModal: React.FC<DetailedListsModalProps> = ({
  category,
  accent,
  isPro,
  isGuest,
  upgradePath,
  onClose,
}) => {
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const titleId = `swot-detailed-${category}`

  // إغلاق بـ Escape، ومنع تمرير الصفحة خلف النافذة
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-slate-50 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* الترويسة */}
        <header className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-4 bg-white border-b border-slate-200">
          <span
            className={clsx(
              "w-10 h-10 shrink-0 rounded-xl text-white text-base font-black flex items-center justify-center shadow-sm",
              accent.badge
            )}
          >
            {accent.letter}
          </span>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2
                id={titleId}
                className="text-base sm:text-lg font-bold text-slate-900 truncate"
              >
                القوائم التفصيلية — {accent.title}
              </h2>
              <span
                className={clsx(
                  "shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-black leading-none",
                  isPro ? "bg-amber-100 text-amber-700" : "bg-amber-500 text-white"
                )}
              >
                {!isPro && <Lock className="w-2.5 h-2.5" strokeWidth={3} />}
                Pro
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              تصنيف معمّق بأمثلة جاهزة تساعدك على تعبئة هذا القسم بدقة.
            </p>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="إغلاق القوائم التفصيلية"
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/*
          المتن — التمرير على العنصر المرن نفسه لا على ابن بارتفاع
          نسبي: النسبة لا تُحلّ داخل عنصر مرن فيتجاوز المحتوى التذييل،
          وابنٌ مطلق كلّه يُفقد الحاوية ارتفاعها الطبيعي فتنطبق.
        */}
        <div
          className={clsx(
            "relative flex-1 min-h-0 px-4 sm:px-6 py-5",
            isPro ? "overflow-y-auto" : "overflow-hidden"
          )}
        >
          {isPro ? (
            <>
              <p className="flex items-start gap-2 mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] text-slate-600 leading-relaxed">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>{swotDetailedLists[category].intro}</span>
              </p>
              <UnlockedContent category={category} accent={accent} />
            </>
          ) : (
            <>
              <LockedPreview category={category} accent={accent} />
              <PaywallOverlay
                category={category}
                upgradePath={upgradePath}
                isGuest={isGuest}
              />
            </>
          )}
        </div>

        {/* التذييل */}
        <footer className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-t border-slate-200">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isPro
              ? "هذه القوائم مرجع للتذكير — اختر ما ينطبق على مشروعك فعلاً."
              : "القفل يخصّ هذه القوائم فقط — بقية الأداة متاحة مجاناً."}
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="shrink-0 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm"
          >
            إغلاق
          </Button>
        </footer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  الواجهة المُصدَّرة — زرّ ونافذته
// ─────────────────────────────────────────────────────────────

interface SwotDetailedListsProps {
  category: SwotQuadrantKey
  accent: QuadrantAccent
}

export const SwotDetailedLists: React.FC<SwotDetailedListsProps> = ({
  category,
  accent,
}) => {
  const { isPro, isGuest, upgradePath } = usePlanAccess()
  const [isOpen, setIsOpen] = React.useState(false)

  const close = React.useCallback(() => setIsOpen(false), [])

  return (
    <>
      <DetailedListsButton
        accent={accent}
        isPro={isPro}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <DetailedListsModal
          category={category}
          accent={accent}
          isPro={isPro}
          isGuest={isGuest}
          upgradePath={upgradePath}
          onClose={close}
        />
      )}
    </>
  )
}

export default SwotDetailedLists
