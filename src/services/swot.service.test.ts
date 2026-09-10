import {
  buildDynamicExecutiveSummary,
  buildHeuristicAnalysis,
  validateAndSanitizeStrategies,
  validateAndSanitizeSummary,
} from "./swot.service"
import { SwotInput, SwotSelectionPayload, SwotStrategies } from "@/types/swot"

describe("SWOT Cross-Strategies Generation & Validation", () => {
  const sampleInput: SwotInput = {
    projectName: "مشروع خدماتي تجريبي",
    sector: "خدمات",
    stage: "running",
    description: "شركة تقدم خدمات حلول تقنية وتجارية للعملاء المحليين",
  }

  const sampleSelections: SwotSelectionPayload = {
    items: {
      strengths: ["خطة متميزة", "إنتاج كبير"],
      weaknesses: ["انتشار جغرافي محدود", "عزلة وغياب شراكات"],
      opportunities: ["ظهور نقاط توزيع جديدة", "كسب المزيد من المواهب البشرية"],
      threats: ["تغير في التركيبة السكانية", "زيادة التنافس الحالي"],
    },
    conflicts: [],
  }

  test("Heuristic analysis generates cross-strategies exclusively from selected items when selections are provided", () => {
    const analysis = buildHeuristicAnalysis(sampleInput, sampleSelections)

    expect(analysis.strategies).toBeDefined()
    expect(analysis.strategies.wo.length).toBeGreaterThan(0)

    // التأكد من أن استراتيجية WxO تذكر نصوص أو كلمات نقاط الضعف المختارات
    const woText = analysis.strategies.wo.join(" ")
    expect(woText).toContain("انتشار جغرافي محدود")
    expect(woText).toContain("عزلة وغياب شراكات")

    // التأكد التام من عدم وجود العبارة الافتراضية "ضعف وعي العلامة"
    expect(woText).not.toContain("ضعف وعي العلامة")
    expect(woText).not.toContain("سرعة القرار")
  })

  test("Sanitizer replaces AI output containing generic terms with dynamic strategies tied to user selections", () => {
    const genericAiStrategies: SwotStrategies = {
      so: ["استثمار سرعة القرار في تجارب التسويق الرقمي"],
      wo: ["معالجة ضعف وعي العلامة بناء محتوى ودليل اجتماعي تجارب عملاء قبل زيادة الإنفاق الإعلاني"],
      st: ["التمايز بالقيمة والخدمة لا بالسعر لتجنب الدخول في حرب أسعار"],
      wt: ["إبقاء التكاليف الثابتة في أدنى مستوى ممكن"],
    }

    const quadrants = {
      strengths: sampleSelections.items.strengths.map((title) => ({ title, source: "user" as const })),
      weaknesses: sampleSelections.items.weaknesses.map((title) => ({ title, source: "user" as const })),
      opportunities: sampleSelections.items.opportunities.map((title) => ({ title, source: "user" as const })),
      threats: sampleSelections.items.threats.map((title) => ({ title, source: "user" as const })),
    }

    const sanitized = validateAndSanitizeStrategies(genericAiStrategies, quadrants, sampleSelections)

    // يجب استبدال الاستراتيجية العامة WxO باستراتيجية مخصصة لعناصر المستخدم
    const sanitizedWoText = sanitized.wo.join(" ")
    expect(sanitizedWoText).not.toContain("ضعف وعي العلامة")
    expect(sanitizedWoText).toContain("انتشار جغرافي محدود")
  })

  test("Analysis without selections continues to produce valid standard strategies", () => {
    const analysis = buildHeuristicAnalysis(sampleInput, null)

    expect(analysis.strategies).toBeDefined()
    expect(analysis.strategies.so.length).toBeGreaterThan(0)
    expect(analysis.strategies.wo.length).toBeGreaterThan(0)
    expect(analysis.strategies.st.length).toBeGreaterThan(0)
    expect(analysis.strategies.wt.length).toBeGreaterThan(0)
  })
})

describe("SWOT Executive Summary Generation & Validation", () => {
  const sampleInput: SwotInput = {
    projectName: "مشروع خدماتي تجريبي",
    sector: "خدمات",
    stage: "running",
    description: "شركة تقدم خدمات حلول تقنية وتجارية للعملاء المحليين",
  }

  const sampleSelections: SwotSelectionPayload = {
    items: {
      strengths: ["خطة متميزة", "إنتاج كبير"],
      weaknesses: ["انتشار جغرافي محدود", "عزلة وغياب شراكات"],
      opportunities: ["ظهور نقاط توزيع جديدة", "كسب المزيد من المواهب البشرية"],
      threats: ["تغير في التركيبة السكانية", "زيادة التنافس الحالي"],
    },
    conflicts: [],
  }

  const allUserItems = [
    "خطة متميزة",
    "إنتاج كبير",
    "انتشار جغرافي محدود",
    "عزلة وغياب شراكات",
    "ظهور نقاط توزيع جديدة",
    "كسب المزيد من المواهب البشرية",
    "تغير في التركيبة السكانية",
    "زيادة التنافس الحالي",
  ]

  test("Heuristic analysis generates an Executive Summary mentioning at least 4 user selected SWOT items", () => {
    const analysis = buildHeuristicAnalysis(sampleInput, sampleSelections)
    const summary = analysis.summary

    expect(summary).toBeDefined()
    expect(summary).toContain("مشروع خدماتي تجريبي")
    expect(summary).not.toContain("استثمار مرونته وقربه من فئته المستهدفة")

    // حساب عدد العناصر المذكورة صراحة أو مفاهيمياً
    let mentionedCount = 0
    for (const item of allUserItems) {
      if (summary.includes(item) || item.split(" ").some((w) => w.length > 3 && summary.includes(w))) {
        mentionedCount++
      }
    }

    expect(mentionedCount).toBeGreaterThanOrEqual(4)
  })

  test("Sanitizer rejects generic old fallback summary and replaces it with dynamic summary referencing user items", () => {
    const oldGenericSummary =
      "يعمل «مشروع خدماتي تجريبي» في قطاع خدمات وهو مشروع قائم ويعمل حالياً. يقوم موقعه الاستراتيجي على استثمار مرونته وقربه من فئته المستهدفة، في مقابل تحديين أساسيين: محدودية الموارد أمام المنافسين المستقرين، وحساسية الربحية لتقلّب التكاليف. الأولوية في المرحلة القادمة هي تثبيت مصدر إيراد متكرر قبل التوسّع في النفقات الثابتة."

    const quadrants = {
      strengths: sampleSelections.items.strengths.map((title) => ({ title, source: "user" as const })),
      weaknesses: sampleSelections.items.weaknesses.map((title) => ({ title, source: "user" as const })),
      opportunities: sampleSelections.items.opportunities.map((title) => ({ title, source: "user" as const })),
      threats: sampleSelections.items.threats.map((title) => ({ title, source: "user" as const })),
    }

    const sanitized = validateAndSanitizeSummary(oldGenericSummary, sampleInput, quadrants, sampleSelections)

    expect(sanitized).not.toContain("استثمار مرونته وقربه من فئته المستهدفة")
    expect(sanitized).toContain("خطة متميزة")
    expect(sanitized).toContain("انتشار جغرافي محدود")

    let mentionedCount = 0
    for (const item of allUserItems) {
      if (sanitized.includes(item)) {
        mentionedCount++
      }
    }
    expect(mentionedCount).toBeGreaterThanOrEqual(4)
  })

  test("Sanitizer preserves high quality AI summary that mentions enough selected user items", () => {
    const validAiSummary =
      "يعمل «مشروع خدماتي تجريبي» في قطاع خدمات وهو مشروع قائم. يقوم الموقف الاستراتيجي على استثمار خطة متميزة وإنتاج كبير لاقتناص ظهور نقاط توزيع جديدة. في المقابل يواجه انتشار جغرافي محدود وعزلة وغياب شراكات."

    const quadrants = {
      strengths: sampleSelections.items.strengths.map((title) => ({ title, source: "user" as const })),
      weaknesses: sampleSelections.items.weaknesses.map((title) => ({ title, source: "user" as const })),
      opportunities: sampleSelections.items.opportunities.map((title) => ({ title, source: "user" as const })),
      threats: sampleSelections.items.threats.map((title) => ({ title, source: "user" as const })),
    }

    const sanitized = validateAndSanitizeSummary(validAiSummary, sampleInput, quadrants, sampleSelections)

    expect(sanitized).toBe(validAiSummary)
  })

  test("Summary generation without user selections still produces a structured summary", () => {
    const summary = buildDynamicExecutiveSummary(sampleInput, {
      strengths: [{ title: "جودة عالية", source: "ai" }],
      weaknesses: [{ title: "ميزانية محدودة", source: "ai" }],
      opportunities: [{ title: "نمو السوق", source: "ai" }],
      threats: [{ title: "منافسة شديدة", source: "ai" }],
    }, null)

    expect(summary).toContain("مشروع خدماتي تجريبي")
    expect(summary).toContain("جودة عالية")
    expect(summary).toContain("ميزانية محدودة")
  })
})
