import { describe, it, expect } from "vitest";
import {
  validateLinkedPorterInput,
  checkPorterImplicationLink,
  orderPorterImplications,
  findMissingPorterImplications,
  type PorterFactorRef,
} from "../src/services/porter/porterLinks";

describe("Porter Links Pure Logic Tests", () => {
  it("يقبل الإدخال السليم للبنود الثلاثة في أي قوة من قوى بورتر الخمس", () => {
    const res = validateLinkedPorterInput({
      force: "newEntrants",
      content: "تسهيل إصدار الرخص الاستثمارية والتحول الرقمي",
      positiveImplication: "سرعة دخول السوق واختبار نموذج العمل",
      negativeImplication: "ازدياد تدفق المنافسين وضغط الأسعار",
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.force).toBe("newEntrants");
      expect(res.value.content).toBe("تسهيل إصدار الرخص الاستثمارية والتحول الرقمي");
      expect(res.value.positiveImplication).toBe("سرعة دخول السوق واختبار نموذج العمل");
      expect(res.value.negativeImplication).toBe("ازدياد تدفق المنافسين وضغط الأسعار");
    }
  });

  it("يرفض الحفظ ويعيد رسائل خطأ عربية دقيقة عند فراغ أي حقل من الحقول الثلاثة", () => {
    const res = validateLinkedPorterInput({
      force: "buyers",
      content: "",
      positiveImplication: "",
      negativeImplication: "",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      const fields = res.issues.map((i) => i.field);
      expect(fields).toContain("content");
      expect(fields).toContain("positiveImplication");
      expect(fields).toContain("negativeImplication");
    }
  });

  it("يرفض ربط انعكاس ببند ليس من نوع trends", () => {
    const parent: PorterFactorRef = {
      id: "f-pos-1",
      force: "suppliers",
      field: "positiveImpacts",
    };
    const child: PorterFactorRef = {
      id: "f-neg-1",
      force: "suppliers",
      field: "negativeImpacts",
    };

    const err = checkPorterImplicationLink(child, parent, []);
    expect(err).toMatch(/يجب أن يكون البند الأب من نوع توجه/);
  });

  it("يرفض ربط انعكاس ببند في قوة تنافسية مختلفة", () => {
    const parent: PorterFactorRef = {
      id: "f-trend-1",
      force: "newEntrants",
      field: "trends",
    };
    const child: PorterFactorRef = {
      id: "f-pos-1",
      force: "rivalry",
      field: "positiveImpacts",
    };

    const err = checkPorterImplicationLink(child, parent, []);
    expect(err).toMatch(/قوة تنافسية مختلفة/);
  });

  it("يمنع وجود انعكاسين من نفس النوع لنفس التوجه", () => {
    const parent: PorterFactorRef = {
      id: "t-1",
      force: "substitutes",
      field: "trends",
    };
    const existingSibling: PorterFactorRef = {
      id: "pos-1",
      force: "substitutes",
      field: "positiveImpacts",
      parentFactorId: "t-1",
    };
    const duplicateChild: PorterFactorRef = {
      id: "pos-2",
      force: "substitutes",
      field: "positiveImpacts",
      parentFactorId: "t-1",
    };

    const err = checkPorterImplicationLink(duplicateChild, parent, [existingSibling]);
    expect(err).toMatch(/مرتبط مسبقاً/);
  });

  it("يرتب الانعكاسات تلقائياً وفق تسلسل التوجهات المرتبطة بها", () => {
    const trends: PorterFactorRef[] = [
      { id: "t-1", force: "rivalry", field: "trends", sortOrder: 0 },
      { id: "t-2", force: "rivalry", field: "trends", sortOrder: 1 },
      { id: "t-3", force: "rivalry", field: "trends", sortOrder: 2 },
    ];

    const implications: PorterFactorRef[] = [
      { id: "p-3", force: "rivalry", field: "positiveImpacts", parentFactorId: "t-3" },
      { id: "p-1", force: "rivalry", field: "positiveImpacts", parentFactorId: "t-1" },
      { id: "p-legacy", force: "rivalry", field: "positiveImpacts", parentFactorId: null },
      { id: "p-2", force: "rivalry", field: "positiveImpacts", parentFactorId: "t-2" },
    ];

    const ordered = orderPorterImplications(implications, trends);
    expect(ordered.map((o) => o.id)).toEqual(["p-1", "p-2", "p-3", "p-legacy"]);
  });

  it("يكتشف بدقة النقص في الانعكاس الإيجابي أو السلبي", () => {
    const siblings: PorterFactorRef[] = [
      { id: "p-1", force: "buyers", field: "positiveImpacts", parentFactorId: "t-1" },
    ];

    const missing = findMissingPorterImplications("t-1", siblings);
    expect(missing.missingPositive).toBe(false);
    expect(missing.missingNegative).toBe(true);

    const missingBoth = findMissingPorterImplications("t-empty", siblings);
    expect(missingBoth.missingPositive).toBe(true);
    expect(missingBoth.missingNegative).toBe(true);
  });
});
