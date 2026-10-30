import { describe, it, expect } from "vitest";
import {
  validateLinkedFactorInput,
  checkImplicationLink,
  orderImplications,
  findMissingImplications,
  resolveSuggestedSource,
  LINKED_MESSAGES,
} from "../src/services/pest/pestLinks";
import {
  parseLinkedItems,
  parseFullLinkedOutput,
  generateHeuristicLinked,
  computeMergePlan,
  type ExistingFactor,
} from "../src/services/pest/pestGeneration";
import { PEST_DIMENSIONS } from "../src/services/pest/pestConstants";

describe("PEST Linked Factors Logic & Validation", () => {
  it("يرفض إنشاء بند إذا كان أي من الحقول الثلاثة ناقصاً ويرجع رسائل عربية واضحة", () => {
    const emptyRes = validateLinkedFactorInput({
      dimension: "political",
      content: "",
      positiveImplication: "",
      negativeImplication: "",
    });
    expect(emptyRes.ok).toBe(false);
    if (!emptyRes.ok) {
      expect(emptyRes.issues).toHaveLength(3);
      expect(emptyRes.issues.find((i) => i.field === "content")?.issue).toBe(
        LINKED_MESSAGES.contentRequired
      );
      expect(emptyRes.issues.find((i) => i.field === "positiveImplication")?.issue).toBe(
        LINKED_MESSAGES.positiveRequired
      );
      expect(emptyRes.issues.find((i) => i.field === "negativeImplication")?.issue).toBe(
        LINKED_MESSAGES.negativeRequired
      );
    }

    const missingPositive = validateLinkedFactorInput({
      dimension: "economic",
      content: "تضخم مستمر",
      positiveImplication: "   ",
      negativeImplication: "تآكل القوة الشرائية",
    });
    expect(missingPositive.ok).toBe(false);
    if (!missingPositive.ok) {
      expect(missingPositive.issues).toHaveLength(1);
      expect(missingPositive.issues[0].field).toBe("positiveImplication");
    }
  });

  it("يقبل البند إذا اكتملت الحقول الثلاثة ويحدد مصادر الذكاء الاصطناعي بدقة", () => {
    const valid = validateLinkedFactorInput({
      dimension: "technological",
      content: "اعتماد الذكاء الاصطناعي والأتمتة",
      positiveImplication: "رفع كفاءة العمليات التشغيلية",
      negativeImplication: "تكاليف تدريب واستثمار أولي مرتفعة",
      aiSuggested: {
        positive: "رفع كفاءة العمليات التشغيلية",
        negative: "تكاليف بنية تحتية سحابية", // عُدلت
      },
    });

    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.value.content).toBe("اعتماد الذكاء الاصطناعي والأتمتة");
      expect(valid.value.positiveSource).toBe("ai");
      expect(valid.value.negativeSource).toBe("ai_edited");
    }
  });

  it("يمنع ربط انعكاس ببند من بُعد آخر أو ببند ليس من نوع trend", () => {
    const parentInLegal = {
      id: "parent-1",
      dimension: "legal",
      category: "trend",
    };

    const impInPolitical = {
      id: "imp-1",
      dimension: "political",
      category: "positive_impact",
    };

    const dimMismatch = checkImplicationLink(impInPolitical, parentInLegal, []);
    expect(dimMismatch).toBe("لا يمكن ربط انعكاس ببند من بُعد آخر.");

    const nonTrendParent = {
      id: "parent-2",
      dimension: "political",
      category: "positive_impact",
    };

    const notTrend = checkImplicationLink(impInPolitical, nonTrendParent, []);
    expect(notTrend).toBe("البند الأب يجب أن يكون من «أبرز التوجهات والمؤشرات».");
  });

  it("يمنع ربط أكثر من انعكاس إيجابي أو سلبي بنفس البند الأب", () => {
    const parent = { id: "p1", dimension: "social", category: "trend" };
    const existingSiblings = [
      { id: "s1", dimension: "social", category: "positive_impact", parentFactorId: "p1" },
    ];

    const duplicatePos = checkImplicationLink(
      { id: "s2", dimension: "social", category: "positive_impact" },
      parent,
      existingSiblings
    );
    expect(duplicatePos).toBe("هذا البند مرتبط مسبقاً بانعكاس إيجابي.");

    const allowedNeg = checkImplicationLink(
      { id: "s3", dimension: "social", category: "negative_impact" },
      parent,
      existingSiblings
    );
    expect(allowedNeg).toBeNull();
  });

  it("يرتّب الانعكاسات تلقائياً حسب ترتيب بنودها الأبوية، مع إبقاء القديمة غير المرتبطة بالأسفل", () => {
    const trends = [
      { id: "t1" }, // الأول
      { id: "t2" }, // الثاني
      { id: "t3" }, // الثالث
    ];

    const implications = [
      { id: "i-legacy", parentFactorId: null, content: "انعكاس قديم بدون أب" },
      { id: "i3", parentFactorId: "t3", content: "انعكاس للبند الثالث" },
      { id: "i1", parentFactorId: "t1", content: "انعكاس للبند الأول" },
      { id: "i2", parentFactorId: "t2", content: "انعكاس للبند الثاني" },
    ];

    const ordered = orderImplications(trends, implications);
    expect(ordered.map((o) => o.id)).toEqual(["i1", "i2", "i3", "i-legacy"]);
  });

  it("يكتشف الانعكاسات الناقصة لكل بند توجه بدقة", () => {
    const trends = [{ id: "t1" }, { id: "t2" }, { id: "t3" }];
    const implications = [
      { parentFactorId: "t1", category: "positive_impact" },
      { parentFactorId: "t1", category: "negative_impact" },
      { parentFactorId: "t2", category: "positive_impact" }, // ينقصه negative_impact
      // t3 ينقصه الاثنان
    ];

    const missing = findMissingImplications(trends, implications);
    expect(missing.has("t1")).toBe(false);
    expect(missing.get("t2")).toEqual(["negative_impact"]);
    expect(missing.get("t3")).toEqual(["positive_impact", "negative_impact"]);
  });

  it("تحقق بنية الذكاء الاصطناعي: يستبعد أي عنصر ينقصه أحد الانعكاسين ولا يقبل انعكاساً بلا أب", () => {
    const rawAiItems = {
      items: [
        {
          content: "بند كامل",
          positiveImplication: "إيجابي كامل",
          negativeImplication: "سلبي كامل",
        },
        {
          content: "بند ناقص إيجابي",
          negativeImplication: "سلبي فقط",
        },
        {
          content: "بند ناقص سلبي",
          positiveImplication: "إيجابي فقط",
        },
        {
          positiveImplication: "انعكاس بلا بند أب",
          negativeImplication: "انعكاس آخر بلا بند أب",
        },
      ],
    };

    const parsed = parseLinkedItems(rawAiItems);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].content).toBe("بند كامل");
  });

  it("المولّد الذكي الاحتياطي (Heuristic) يضمن إنتاج توجهات مع انعكاسيها لجميع الأبعاد الخمسة", () => {
    const ctx = {
      projectName: "مطعم تجريبي",
      industry: "أغذية ومطاعم",
      countryRegion: "المملكة العربية السعودية",
      existingFactors: [],
    };

    const generated = generateHeuristicLinked(ctx, PEST_DIMENSIONS, 3);
    expect(generated.length).toBe(15); // 3 لكل بعد * 5 أبعاد

    for (const item of generated) {
      expect(item.content.length).toBeGreaterThan(10);
      expect(item.positiveImplication.length).toBeGreaterThan(10);
      expect(item.negativeImplication.length).toBeGreaterThan(10);
      expect(item.source).toBe("ai");
    }
  });
});
