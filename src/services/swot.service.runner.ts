import assert from "node:assert"
import { buildHeuristicAnalysis, validateAndSanitizeStrategies } from "./swot.service"
import type { SwotInput, SwotSelectionPayload, SwotStrategies } from "@/types/swot"

console.log("=== بدء تشغيل اختبارات الاستراتيجيات التقاطعية ===")

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

// 1. اختبار التوليد القاعدي مع وجود الاختيارات
console.log("الاختبار 1: التوليد القاعدي بناءً على عناصر المستخدم...")
const analysis = buildHeuristicAnalysis(sampleInput, sampleSelections)
assert(analysis.strategies, "يجب أن توجد استراتيجيات تقاطعية")
assert(analysis.strategies.wo.length > 0, "يجب أن توجد استراتيجيات WxO")

const woText = analysis.strategies.wo.join(" ")
assert(woText.includes("انتشار جغرافي محدود"), "يجب أن تذكر WxO البند الأول المختار: انتشار جغرافي محدود")
assert(woText.includes("عزلة وغياب شراكات"), "يجب أن تذكر WxO البند الثاني المختار: عزلة وغياب شراكات")
assert(!woText.includes("ضعف وعي العلامة"), "يجب عدم إدراج العبارة الافتراضية: ضعف وعي العلامة")
assert(!woText.includes("سرعة القرار"), "يجب عدم إدراج العبارة غير المختارة: سرعة القرار")
console.log("✅ الاختبار 1 نجح بنجاح! مخرجات WxO:\n", analysis.strategies.wo)

// 2. اختبار المنظف واستبدال نصوص AI العامة
console.log("\nالاختبار 2: فحص وتنقية نصوص AI العامة واستبدالها بنصوص مخصصة...")
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
const sanitizedWoText = sanitized.wo.join(" ")
assert(!sanitizedWoText.includes("ضعف وعي العلامة"), "تم استبعاد نص AI العام")
assert(sanitizedWoText.includes("انتشار جغرافي محدود"), "تم استبداله بنص ديناميكي مرتبط باختيار المستخدم")
console.log("✅ الاختبار 2 نجح بنجاح! ناتج التنقية لـ WxO:\n", sanitized.wo)

// 3. اختبار التوليد بدون اختيارات
console.log("\nالاختبار 3: التوليد المعتاد عند غياب الاختيارات (без selections)...")
const defaultAnalysis = buildHeuristicAnalysis(sampleInput, null)
assert(defaultAnalysis.strategies.wo.length > 0, "توليد استراتيجيات قطاعية افتراضية بنجاح")
console.log("✅ الاختبار 3 نجح بنجاح!")

console.log("\n🎉 جميع الاختبارات الثلاثة مرت بنجاح تام!")
