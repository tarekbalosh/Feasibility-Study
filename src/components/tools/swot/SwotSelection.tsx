import React from "react"
import clsx from "clsx"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Eraser,
  Info,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { SwotDetailedLists } from "@/components/tools/swot/SwotDetailedLists"
import {
  MAX_CUSTOM_ITEM_LENGTH,
  SEARCH_VISIBILITY_THRESHOLD,
  SWOT_CATEGORY_ORDER,
  normalizeArabic,
  swotSuggestions,
} from "@/config/swotSuggestions"
import {
  conflictIdSet,
  countSelected,
  getCategoryChips,
  type SwotConflict,
} from "@/utils/swotSelections"
import type { SwotCustomErrors } from "@/hooks/useSwotTool"
import type { SwotQuadrantKey, SwotSelections } from "@/types/swot"

/**
 * ─────────────────────────────────────────────────────────────
 *  شاشة اختيار العناصر — الخطوة الوسيطة قبل التوليد
 * ─────────────────────────────────────────────────────────────
 *  الخطوة اختيارية بالكامل: الاختيارات مُدخلات موجِّهة للنموذج،
 *  لا مخرجات نهائية. لا قائمة بنود مكتوبة هنا — كلّها من
 *  config/swotSuggestions.ts
 *
 *  العرض: مصفوفة ٢×٢ ببطاقات متساوية الارتفاع، وكل بند سطر
 *  كامل العرض بمربّع اختيار — بدل الأقراص متفاوتة العرض التي
 *  كانت تلتفّ بحوافّ مسنّنة يصعب مسحها بالعين.
 * ─────────────────────────────────────────────────────────────
 */

/** ألوان كل مجموعة مطابقة لخانتها في المصفوفة النهائية */
const CATEGORY_STYLES: Record<
  SwotQuadrantKey,
  {
    letter: string
    title: string
    subtitle: string
    icon: typeof TrendingUp
    badge: string
    header: string
    bar: string
    count: string
    itemOn: string
    itemOff: string
    boxOn: string
    boxOff: string
    focus: string
  }
> = {
  strengths: {
    letter: "S",
    title: "نقاط القوة",
    subtitle: "عوامل داخلية تعمل لصالحك",
    icon: TrendingUp,
    badge: "bg-emerald-600",
    header: "bg-emerald-50/70 border-emerald-100",
    bar: "bg-emerald-500",
    count: "text-emerald-700",
    itemOn: "border-emerald-300 bg-emerald-50 text-emerald-950",
    itemOff:
      "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40",
    boxOn: "bg-emerald-600 border-emerald-600 text-white",
    boxOff: "border-slate-300 bg-white group-hover:border-emerald-400",
    focus: "focus-visible:ring-emerald-500",
  },
  weaknesses: {
    letter: "W",
    title: "نقاط الضعف",
    subtitle: "عوامل داخلية تحتاج معالجة",
    icon: TrendingDown,
    badge: "bg-rose-600",
    header: "bg-rose-50/70 border-rose-100",
    bar: "bg-rose-500",
    count: "text-rose-700",
    itemOn: "border-rose-300 bg-rose-50 text-rose-950",
    itemOff:
      "border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/40",
    boxOn: "bg-rose-600 border-rose-600 text-white",
    boxOff: "border-slate-300 bg-white group-hover:border-rose-400",
    focus: "focus-visible:ring-rose-500",
  },
  opportunities: {
    letter: "O",
    title: "الفرص",
    subtitle: "عوامل خارجية يمكن اقتناصها",
    icon: Target,
    badge: "bg-sky-600",
    header: "bg-sky-50/70 border-sky-100",
    bar: "bg-sky-500",
    count: "text-sky-700",
    itemOn: "border-sky-300 bg-sky-50 text-sky-950",
    itemOff:
      "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/40",
    boxOn: "bg-sky-600 border-sky-600 text-white",
    boxOff: "border-slate-300 bg-white group-hover:border-sky-400",
    focus: "focus-visible:ring-sky-500",
  },
  threats: {
    letter: "T",
    title: "المخاطر",
    subtitle: "عوامل خارجية يجب التحوّط لها",
    icon: AlertTriangle,
    badge: "bg-amber-600",
    header: "bg-amber-50/70 border-amber-100",
    bar: "bg-amber-500",
    count: "text-amber-700",
    itemOn: "border-amber-300 bg-amber-50 text-amber-950",
    itemOff:
      "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/40",
    boxOn: "bg-amber-600 border-amber-600 text-white",
    boxOff: "border-slate-300 bg-white group-hover:border-amber-400",
    focus: "focus-visible:ring-amber-500",
  },
}

/** أرقام عربية-هندية في نصوص الواجهة العربية */
const ar = (value: number): string => value.toLocaleString("ar-EG")

/**
 * الطيّ سلوك جوال فقط: على سطح المكتب المجموعات مفتوحة دائماً.
 * نحتاج معرفة المقاس في JS لا في CSS وحدها، حتى لا تُعلن الترويسة
 * حالة طيّ (aria-expanded) لا وجود لها على سطح المكتب.
 */
const useIsDesktop = (): boolean => {
  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)")
    const sync = () => setIsDesktop(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  return isDesktop
}

// ─────────────────────────────────────────────────────────────
//  مجموعة واحدة
// ─────────────────────────────────────────────────────────────

interface CategoryGroupProps {
  category: SwotQuadrantKey
  selections: SwotSelections
  conflicts: SwotConflict[]
  customError?: string
  maxCustomItems: number
  onToggle: (category: SwotQuadrantKey, id: string) => void
  onAddCustom: (category: SwotQuadrantKey, label: string) => boolean
  onRemoveCustom: (category: SwotQuadrantKey, id: string) => void
  onClearCustomError: (category: SwotQuadrantKey) => void
  onClearCategory: (category: SwotQuadrantKey) => void
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  selections,
  conflicts,
  customError,
  maxCustomItems,
  onToggle,
  onAddCustom,
  onRemoveCustom,
  onClearCustomError,
  onClearCategory,
}) => {
  const style = CATEGORY_STYLES[category]
  const Icon = style.icon
  const selection = selections[category]
  const panelId = `swot-group-${category}`

  const isDesktop = useIsDesktop()
  const [open, setOpen] = React.useState(true)
  const [query, setQuery] = React.useState("")
  const [draft, setDraft] = React.useState("")

  const chips = React.useMemo(
    () => getCategoryChips(category, selection),
    [category, selection]
  )

  const selectedIds = React.useMemo(
    () => new Set(selection.selectedIds),
    [selection.selectedIds]
  )

  // حقل البحث يظهر فقط للقوائم الطويلة — لا داعي له في قائمة من ١٢ بنداً
  const showSearch = swotSuggestions[category].length > SEARCH_VISIBILITY_THRESHOLD

  const visibleChips = React.useMemo(() => {
    const normalized = normalizeArabic(query)
    if (!normalized) return chips
    return chips.filter((chip) => normalizeArabic(chip.label).includes(normalized))
  }, [chips, query])

  // التعارضات التي تخصّ هذه المجموعة فقط
  const groupConflicts = React.useMemo(
    () =>
      category === "strengths" || category === "weaknesses" ? conflicts : [],
    [category, conflicts]
  )
  const conflicting = React.useMemo(
    () => conflictIdSet(groupConflicts),
    [groupConflicts]
  )

  const selectedCount = countSelected(selection)
  const customCount = selection.customItems.length
  const progress = chips.length ? (selectedCount / chips.length) * 100 : 0

  const submitCustom = () => {
    if (onAddCustom(category, draft)) setDraft("")
  }

  return (
    <section className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/*
        ترويسة المجموعة — صفّ واحد يضمّ زرّ الطيّ (جوال) وزرّ القوائم
        التفصيلية. الزرّان متجاوران لا متداخلان: زرّ داخل زرّ ترميز
        غير صالح، ولذا صارت الترويسة عنصر div يحوي أزرارها.
      */}
      <div
        className={clsx(
          "flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3 w-full border-b",
          style.header
        )}
      >
        <button
          type="button"
          onClick={isDesktop ? undefined : () => setOpen((prev) => !prev)}
          aria-expanded={isDesktop ? undefined : open}
          aria-controls={isDesktop ? undefined : panelId}
          className={clsx(
            "order-1 flex items-center gap-3 flex-1 min-w-0 text-right",
            isDesktop && "cursor-default"
          )}
        >
          <span
            className={clsx(
              "w-9 h-9 rounded-xl text-white text-sm font-black flex items-center justify-center shrink-0 shadow-sm",
              style.badge
            )}
          >
            {style.letter}
          </span>

          <span className="flex flex-col flex-1 min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold text-slate-900">
                {style.title}
              </span>
              <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              {style.subtitle}
            </span>
          </span>
        </button>

        {/*
          ميزة مدفوعة — الزرّ ظاهر للجميع، والقفل داخل النافذة.
          على الشاشات الضيّقة ينزل إلى سطر خاص به حتى لا يزاحم
          عنوان المجموعة على مساحة لا تكفيهما معاً.
        */}
        <div className="order-3 basis-full sm:order-2 sm:basis-auto">
          <SwotDetailedLists
            category={category}
            accent={{
              letter: style.letter,
              title: style.title,
              badge: style.badge,
              header: style.header,
              text: style.count,
            }}
          />
        </div>

        <span className="order-2 sm:order-3 flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-bold tabular-nums">
            <span className={style.count}>{ar(selectedCount)}</span>
            <span className="text-slate-400 font-medium">
              {" / "}
              {ar(chips.length)}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? "طيّ" : "فتح"} بنود ${style.title}`}
            className="lg:hidden w-7 h-7 -ml-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors duration-150"
          >
            <ChevronDown
              className={clsx(
                "w-5 h-5 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </button>
        </span>
      </div>

      {/* شريط تقدّم رفيع — نسبة ما اختير من المجموعة */}
      <div className="h-[3px] bg-slate-100 shrink-0">
        <div
          className={clsx("h-full transition-all duration-300", style.bar)}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* المحتوى — مفتوح افتراضياً على الجوال، ولا يُطوى على سطح المكتب */}
      <div
        id={panelId}
        className={clsx(
          "flex flex-col flex-1 min-h-0",
          !open && !isDesktop && "hidden"
        )}
      >
        {showSearch && (
          <div className="relative px-4 pt-3 pb-1 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 mt-1 -translate-y-1/2 right-7 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في البنود…"
              aria-label={`تصفية بنود ${style.title}`}
              className="w-full min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 focus:bg-white transition-colors"
            />
          </div>
        )}

        {/* قائمة البنود — أسطر متساوية العرض، ومنطقة تمرير على سطح المكتب */}
        <div className="relative flex-1 min-h-0">
          <div className="flex flex-col gap-1.5 px-4 py-3 lg:max-h-[19rem] lg:overflow-y-auto">
            {visibleChips.map((chip) => {
              const isSelected = selectedIds.has(chip.id)
              const isConflicting = isSelected && conflicting.has(chip.id)

              return (
                <div
                  key={chip.id}
                  className={clsx(
                    "group flex items-stretch rounded-xl border transition-colors duration-150",
                    isSelected ? style.itemOn : style.itemOff,
                    isConflicting && "ring-2 ring-amber-300"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onToggle(category, chip.id)}
                    aria-pressed={isSelected}
                    className={clsx(
                      "flex flex-1 min-w-0 items-center gap-2.5 min-h-[44px] px-3 py-2 text-right rounded-xl focus:outline-none focus-visible:ring-2",
                      style.focus
                    )}
                  >
                    <span
                      className={clsx(
                        "w-[18px] h-[18px] shrink-0 rounded-md border-2 flex items-center justify-center transition-colors duration-150",
                        isSelected ? style.boxOn : style.boxOff
                      )}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3" strokeWidth={3.5} />
                      )}
                    </span>

                    {chip.isCustom && (
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    )}

                    <span className="flex-1 text-[13px] sm:text-sm font-medium leading-snug">
                      {chip.label}
                    </span>
                  </button>

                  {/* البنود المخصّصة فقط تُحذف — الجاهزة تُلغى ولا تُحذف */}
                  {chip.isCustom && (
                    <button
                      type="button"
                      onClick={() => onRemoveCustom(category, chip.id)}
                      aria-label={`حذف البند «${chip.label}»`}
                      className="shrink-0 w-10 flex items-center justify-center rounded-l-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}

            {visibleChips.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                <SearchX className="w-6 h-6 text-slate-300" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  لا بند يطابق «{query}»
                  <br />
                  يمكنك إضافته يدوياً بالأسفل.
                </p>
              </div>
            )}
          </div>

          {/* تلميح بصري لوجود تمرير — على سطح المكتب فقط */}
          <div
            className="hidden lg:block pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-white to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* تنبيه التعارض — غير معطِّل، ولا يُلغي أي اختيار */}
        {groupConflicts.length > 0 && (
          <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span>
                اخترت بندين متعارضين — وضّح ذلك في وصف النشاط إن كان مقصوداً.
              </span>
              <ul className="flex flex-col gap-0.5 opacity-80">
                {groupConflicts.map((conflict) => (
                  <li key={conflict.strengthId}>
                    «{conflict.strength}» ↔ «{conflict.weakness}»
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* تذييل البطاقة: الإضافة اليدوية ومسح التحديدات */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 px-4 py-3 flex flex-col gap-2">
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              value={draft}
              maxLength={MAX_CUSTOM_ITEM_LENGTH + 20}
              onChange={(e) => {
                setDraft(e.target.value)
                if (customError) onClearCustomError(category)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  submitCustom()
                }
              }}
              placeholder="أضف بنداً خاصاً بمشروعك…"
              aria-label={`إضافة بند إلى ${style.title}`}
              aria-invalid={Boolean(customError)}
              className={clsx(
                "flex-1 min-w-0 min-h-[42px] rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2",
                customError
                  ? "border-red-300 focus:ring-red-200"
                  : "border-slate-200 focus:ring-slate-200 focus:border-slate-300"
              )}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={submitCustom}
              className="shrink-0 min-h-[42px] rounded-xl border border-slate-200 bg-white hover:bg-white hover:border-slate-300 px-3.5 py-2 text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              إضافة
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2">
            {customError ? (
              <p className="text-[11px] text-red-600">{customError}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                بنودك المخصّصة: {ar(customCount)} من {ar(maxCustomItems)} — حتى{" "}
                {ar(MAX_CUSTOM_ITEM_LENGTH)} حرفاً.
              </p>
            )}

            {/* مسح تحديدات المجموعة — لا زر «تحديد الكل» بقصد */}
            <button
              type="button"
              onClick={() => onClearCategory(category)}
              disabled={selectedCount === 0}
              className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 disabled:text-slate-300 disabled:hover:text-slate-300 px-2 py-1 rounded-md hover:bg-white disabled:hover:bg-transparent transition-colors duration-150"
            >
              <Eraser className="w-3.5 h-3.5" />
              مسح التحديدات
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
//  الشاشة
// ─────────────────────────────────────────────────────────────

interface SwotSelectionProps {
  projectName: string
  selections: SwotSelections
  conflicts: SwotConflict[]
  totalSelected: number
  customErrors: SwotCustomErrors
  maxCustomItems: number
  generateError?: string | null
  onToggle: (category: SwotQuadrantKey, id: string) => void
  onAddCustom: (category: SwotQuadrantKey, label: string) => boolean
  onRemoveCustom: (category: SwotQuadrantKey, id: string) => void
  onClearCustomError: (category: SwotQuadrantKey) => void
  onClearCategory: (category: SwotQuadrantKey) => void
  onGenerate: () => void
  onSkip: () => void
  onBack: () => void
}

export const SwotSelection: React.FC<SwotSelectionProps> = ({
  projectName,
  selections,
  conflicts,
  totalSelected,
  customErrors,
  maxCustomItems,
  generateError,
  onToggle,
  onAddCustom,
  onRemoveCustom,
  onClearCustomError,
  onClearCategory,
  onGenerate,
  onSkip,
  onBack,
}) => (
  <div className="flex flex-col gap-5" dir="rtl">
    {/* الترويسة والنص الإرشادي */}
    <div className="flex flex-col gap-2">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
        ما ينطبق على «{projectName || "مشروعك"}»؟
      </h2>
      <p className="flex items-start gap-2 text-sm text-slate-500 leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
        <span>
          اختر ما ينطبق على مشروعك، أو أضف بنودك الخاصة — يمكنك تخطّي هذه الخطوة.
          كل بند تختاره سيوسّعه الذكاء الاصطناعي إلى تحليل مرتبط بنشاطك وقطاعك.
        </span>
      </p>
    </div>

    {/* شريط الحصيلة — نظرة سريعة على ما اختير في المجموعات الأربع */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {SWOT_CATEGORY_ORDER.map((category) => {
        const style = CATEGORY_STYLES[category]
        const count = countSelected(selections[category])

        return (
          <div
            key={category}
            className={clsx(
              "flex items-center gap-2 rounded-xl border px-3 py-2",
              count > 0
                ? `${style.header} border-transparent`
                : "border-slate-200 bg-white"
            )}
          >
            <span
              className={clsx(
                "w-6 h-6 rounded-lg text-white text-[11px] font-black flex items-center justify-center shrink-0",
                count > 0 ? style.badge : "bg-slate-300"
              )}
            >
              {style.letter}
            </span>
            <span className="flex-1 min-w-0 text-[11px] font-medium text-slate-600 truncate">
              {style.title}
            </span>
            <span
              className={clsx(
                "text-sm font-bold tabular-nums",
                count > 0 ? style.count : "text-slate-300"
              )}
            >
              {ar(count)}
            </span>
          </div>
        )
      })}
    </div>

    {/* فشل التوليد — الاختيارات محفوظة كما هي */}
    {generateError && (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <div className="flex items-start gap-2 flex-1 text-sm text-red-800 leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{generateError} اختياراتك محفوظة كما هي.</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onGenerate}
          className="shrink-0 min-h-[44px] border border-red-200 bg-white hover:bg-red-50 text-red-700 px-4 py-2 text-sm gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    )}

    {/* المجموعات — عمود متتابع على الجوال، ومصفوفة ٢×٢ على سطح المكتب */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-stretch">
      {SWOT_CATEGORY_ORDER.map((category) => (
        <CategoryGroup
          key={category}
          category={category}
          selections={selections}
          conflicts={conflicts}
          customError={customErrors[category]}
          maxCustomItems={maxCustomItems}
          onToggle={onToggle}
          onAddCustom={onAddCustom}
          onRemoveCustom={onRemoveCustom}
          onClearCustomError={onClearCustomError}
          onClearCategory={onClearCategory}
        />
      ))}
    </div>

    {/* أزرار الخطوة — شريط ملتصق بأسفل الشاشة على سطح المكتب */}
    <div className="hidden sm:flex sticky bottom-4 z-20 flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
      <Button
        type="button"
        variant="primary"
        onClick={onGenerate}
        className="px-6 py-3 text-base gap-2 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500"
      >
        <Sparkles className="w-5 h-5" />
        توليد التحليل
        {totalSelected > 0 && (
          <span className="text-xs font-semibold bg-white/20 rounded-full px-2 py-0.5 tabular-nums">
            {ar(totalSelected)}
          </span>
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onSkip}
        className="border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-sm"
      >
        تخطّي — دع الذكاء الاصطناعي يقترح كل شيء
      </Button>
      <div className="flex-1" />
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="px-4 py-3 text-sm text-slate-500 hover:text-slate-900"
      >
        رجوع
      </Button>
    </div>

    {/* الجوال: رجوع وتخطّي في المتن، والتوليد في الشريط الثابت */}
    <div className="flex sm:hidden flex-col gap-2 pt-2 border-t border-slate-200">
      <Button
        type="button"
        variant="ghost"
        onClick={onSkip}
        className="min-h-[44px] border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm"
      >
        تخطّي — دع الذكاء الاصطناعي يقترح كل شيء
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="min-h-[44px] px-4 py-2 text-sm text-slate-500"
      >
        رجوع إلى بيانات المشروع
      </Button>
      {/* مساحة تعويض ارتفاع الشريط الثابت */}
      <div className="h-16" aria-hidden="true" />
    </div>

    {/* الشريط السفلي الثابت على الجوال */}
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2.5 flex items-center gap-3">
      <div className="flex flex-col leading-tight">
        <span className="text-base font-bold text-slate-900 tabular-nums">
          {ar(totalSelected)}
        </span>
        <span className="text-[11px] text-slate-500">بنداً مختاراً</span>
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={onGenerate}
        className="flex-1 min-h-[48px] px-4 py-3 text-sm gap-2 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500"
      >
        <Sparkles className="w-4 h-4" />
        توليد التحليل
      </Button>
    </div>
  </div>
)

export default SwotSelection
