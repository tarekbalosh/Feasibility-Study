import assert from "node:assert"
import {
  generateCategoryRecommendation,
  validateAndSanitizeCategoryRecommendation,
  type CategorizedItem,
} from "../utils/swotCategory"

console.log("=== بدء تشغيل اختبارات التوصيات الفئوية (الاستراتيجيات التقليدية) ===")

// -------------------------------------------------------------
// المثال الأول: فئة "تمويل وموارد" مع عنصر "خطة متميزة"
// -------------------------------------------------------------
console.log("\nالاختبار 1: فئة «تمويل وموارد» مع عنصر «خطة متميزة»...")

const financeItems: CategorizedItem[] = [
  {
    item: {
      title: "خطة متميزة",
      detail: "خطة مكتوبة بأهداف ومؤشرات وجدول زمني يجعل قرارات التشغيل والتمويل مبنية على مسار واضح",
      source: "user",
    },
    quadrantKey: "strengths",
  },
]

const rec1 = validateAndSanitizeCategoryRecommendation(
  generateCategoryRecommendation("تمويل وموارد", financeItems),
  "تمويل وموارد",
  financeItems
)

console.log("مخرجات التوصية:\n", rec1)

assert(rec1.includes("خطة متميزة"), "يجب أن تذكر التوصية عنوان البند المختار: خطة متميزة")
assert(rec1.includes("أهداف ومؤشرات") || rec1.includes("جدول زمني"), "يجب أن تعكس التوصية تفاصيل التخطيط والأهداف والمؤشرات")
assert(!rec1.includes("السيولة المتاحة"), "يجب عدم ذكر السيولة المتاحة لأنها غير موجدة في تفاصيل البند")
assert(!rec1.includes("احتياطي طوارئ"), "يجب عدم ذكر احتياطي الطوارئ")

console.log("✅ الاختبار 1 نجح بنجاح!")

// -------------------------------------------------------------
// المثال الثاني: فئة "موارد بشرية وثقافة" مع عنصر "كسب المزيد من المواهب البشرية"
// -------------------------------------------------------------
console.log("\nالاختبار 2: فئة «موارد بشرية وثقافة» مع عنصر «كسب المزيد من المواهب البشرية»...")

const hrItems: CategorizedItem[] = [
  {
    item: {
      title: "كسب المزيد من المواهب البشرية",
      detail: "توفر كفاءات في السوق يتيح بناء فريق أقوى بكلفة توظيف معقولة",
      source: "user",
    },
    quadrantKey: "opportunities",
  },
]

const rec2 = validateAndSanitizeCategoryRecommendation(
  generateCategoryRecommendation("موارد بشرية وثقافة", hrItems),
  "موارد بشرية وثقافة",
  hrItems
)

console.log("مخرجات التوصية:\n", rec2)

assert(rec2.includes("كسب المزيد من المواهب البشرية"), "يجب أن تذكر التوصية عنوان البند: كسب المزيد من المواهب البشرية")
assert(rec2.includes("كفاءات في السوق") || rec2.includes("توظيف"), "يجب أن تركز التوصية على استقطاب كفاءات جديدة وتوظيفها من السوق")
assert(!rec2.includes("تدريب الموظفين الحاليين"), "يجب عدم ذكر تدريب الموظفين الحاليين لأن البند عن استقطاب كفاءات جديدة")

console.log("✅ الاختبار 2 نجح بنجاح!")

// -------------------------------------------------------------
// المثال الثالث: فئة "عوامل أخرى" مع 3 عناصر مختلفة
// -------------------------------------------------------------
console.log("\nالاختبار 3: فئة «عوامل أخرى» مع 3 عناصر مختلفة (2 نقاط ضعف + 1 مخاطرة)...")

const otherItems: CategorizedItem[] = [
  {
    item: {
      title: "انتشار جغرافي محدود",
      detail: "الاعتماد على منطقة واحدة يجعل الإيراد رهينة ظروفها",
      source: "user",
    },
    quadrantKey: "weaknesses",
  },
  {
    item: {
      title: "عزلة وغياب شراكات",
      detail: "غياب الشراكات يحل كلفة الوصول إلى كل عميل جديد",
      source: "user",
    },
    quadrantKey: "weaknesses",
  },
  {
    item: {
      title: "زيادة التنافس الحالي",
      detail: "توسع المنافسين الحاليين يضغط على الحصة والهامش",
      source: "user",
    },
    quadrantKey: "threats",
  },
]

const rec3 = validateAndSanitizeCategoryRecommendation(
  generateCategoryRecommendation("عوامل أخرى", otherItems),
  "عوامل أخرى",
  otherItems
)

console.log("مخرجات التوصية:\n", rec3)

assert(rec3.includes("انتشار جغرافي محدود"), "يجب أن تتناول التوصية البند الأول صراحة")
assert(rec3.includes("عزلة وغياب شراكات"), "يجب أن تتناول التوصية البند الثاني صراحة")
assert(rec3.includes("زيادة التنافس الحالي"), "يجب أن تتناول التوصية البند الثالث صراحة")
assert(!rec3.includes("راقب هذه العوامل بشكل مستمر واستعد لخطط بديلة"), "يجب عدم إرجاع الجملة السطحية العامة الفارغة")

console.log("✅ الاختبار 3 نجح بنجاح!")

console.log("\n🎉 جميع اختبارات التوصيات الفئوية الـ 3 مرت بنجاح تام!")
