import assert from "node:assert";
import {
  computeMergePlan,
  ExistingFactor,
  ProposedFactor,
} from "../src/services/pest/pestGeneration";

console.log("=== بدء تشغيل اختبارات منطق دمج واستراتيجيات تحليل PEST ===");

const sampleExistingFactors: ExistingFactor[] = [
  // Political
  {
    id: "f-1",
    dimension: "political",
    category: "trend",
    content: "استقرار تشريعي محلي",
    sortOrder: 0,
    source: "manual", // يدوي محمي
  },
  {
    id: "f-2",
    dimension: "political",
    category: "positive_impact",
    content: "حوافز استثمارية حكومية",
    sortOrder: 0,
    source: "ai", // مولد بالذكاء الاصطناعي
  },
  {
    id: "f-3",
    dimension: "political",
    category: "negative_impact",
    content: "بيروقراطية وتعديل يدوي",
    sortOrder: 0,
    source: "ai_edited", // معدل يدوياً - محمي!
  },
  // Economic
  {
    id: "f-4",
    dimension: "economic",
    category: "trend",
    content: "تضخم متوقع",
    sortOrder: 0,
    source: "ai",
  },
];

const sampleNewPoliticalFactors: ProposedFactor[] = [
  {
    dimension: "political",
    category: "trend",
    content: "توجه نحو الرقمنة والخدمات الإلكترونية",
    source: "ai",
  },
  {
    dimension: "political",
    category: "positive_impact",
    content: "تسهيل إصدار التراخيص",
    source: "ai",
  },
];

// 1. اختبار استراتيجية append: لا يحذف أي شيء ويضيف الجديد دائماً
console.log("\n1. اختبار استراتيجية append...");
{
  const plan = computeMergePlan(
    "dimension",
    "append",
    "political",
    undefined,
    sampleExistingFactors,
    sampleNewPoliticalFactors,
    false // confirmOverwrite = false
  );

  assert.strictEqual(plan.hasProtectedManualConflict, false, "لا يوجد تعارض في وضع append");
  assert.strictEqual(plan.factorsToDeleteIds.length, 0, "يجب عدم حذف أي بند في وضع append");
  assert.strictEqual(plan.factorsToCreate.length, sampleNewPoliticalFactors.length, "يجب إنشاء جميع البنود المقترحة");
  console.log("✅ نجح اختبار append بنجاح.");
}

// 2. اختبار استراتيجية replace مع وجود بنود يدوية ودون تأكيد (حماية البنود اليدوية)
console.log("\n2. اختبار حماية البنود اليدوية والمعدلة عند replace بدون تأكيد...");
{
  const plan = computeMergePlan(
    "dimension",
    "replace",
    "political",
    undefined,
    sampleExistingFactors,
    sampleNewPoliticalFactors,
    false // confirmOverwrite = false
  );

  assert.strictEqual(plan.hasProtectedManualConflict, true, "يجب اكتشاف تعارض مع البنود اليدوية والمعدلة");
  assert.strictEqual(plan.protectedManualCount, 2, "يجب رصد بندين محميين (manual و ai_edited)");
  assert.strictEqual(plan.factorsToDeleteIds.length, 0, "يجب عدم حذف أي بند دون تأكيد صريح");
  assert.strictEqual(plan.factorsToCreate.length, 0, "يجب عدم إنشاء أي بند جديد قبل الحصول على التأكيد");
  console.log("✅ نجح اختبار حماية البنود اليدوية (منع الاستبدال غير المصرح به).");
}

// 3. اختبار استراتيجية replace مع تأكيد صريح (confirmOverwrite = true)
console.log("\n3. اختبار استراتيجية replace مع تأكيد صريح (confirmOverwrite = true)...");
{
  const plan = computeMergePlan(
    "dimension",
    "replace",
    "political",
    undefined,
    sampleExistingFactors,
    sampleNewPoliticalFactors,
    true // confirmOverwrite = true
  );

  assert.strictEqual(plan.hasProtectedManualConflict, false, "لا تعارض عند وجود التأكيد الصريح");
  assert.deepStrictEqual(
    plan.factorsToDeleteIds.sort(),
    ["f-1", "f-2", "f-3"].sort(),
    "يجب حذف جميع بنود البعد السياسي في النطاق المستهدف"
  );
  assert.strictEqual(plan.factorsToCreate.length, sampleNewPoliticalFactors.length, "يجب إنشاء البنود المقترحة");
  console.log("✅ نجح اختبار الاستبدال مع التأكيد.");
}

// 4. اختبار عزل النطاق (Scope Isolation: category و dimension)
console.log("\n4. اختبار عزل النطاق الجزئي (Dimension & Category)...");
{
  // تجربة replace على بُعد economic فقط (لا يحتوي بنوداً يدوية)
  const economicNew: ProposedFactor[] = [
    {
      dimension: "economic",
      category: "trend",
      content: "نمو متسارع في قطاع التجزئة",
      source: "ai",
    },
  ];

  const plan = computeMergePlan(
    "dimension",
    "replace",
    "economic",
    undefined,
    sampleExistingFactors,
    economicNew,
    false
  );

  assert.strictEqual(plan.hasProtectedManualConflict, false, "لا تعارض لأن البعد الاقتصادي يحتوي فقط بنود ai");
  assert.deepStrictEqual(plan.factorsToDeleteIds, ["f-4"], "يجب حذف بنود البعد الاقتصادي فقط");
  assert.strictEqual(plan.factorsToCreate.length, 1);
  console.log("✅ نجح اختبار عزل النطاق الجزئي بنجاح.");
}

console.log("\n🎉 جميع اختبارات PEST Generation المنطقية مرت بنجاح 100%!");
