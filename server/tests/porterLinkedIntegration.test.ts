import { describe, it, expect } from "vitest";
import {
  validateLinkedPorterInput,
  findMissingPorterImplications,
  orderPorterImplications,
} from "../src/services/porter/porterLinks";
import {
  suggestPorterImplications,
  generateHeuristicPorterForces,
} from "../src/services/porter/porterGeneration";
import { PorterFactorItem } from "../src/services/porter/porterConstants";

describe("Porter Linked Factors Integration & Workflow Tests", () => {
  it("suggestPorterImplications returns Arabic positive & negative implications for a given trend", async () => {
    const result = await suggestPorterImplications({
      force: "newEntrants",
      content: "ارتفاع تكاليف التأسيس ومتطلبات رأس المال العالي",
      projectName: "تطبيق التوصيل السريع",
      industry: "اللوجستيات",
    });

    expect(result).toBeDefined();
    expect(result.positiveImplication.trim().length).toBeGreaterThan(5);
    expect(result.negativeImplication.trim().length).toBeGreaterThan(5);
    expect(typeof result.positiveImplication).toBe("string");
    expect(typeof result.negativeImplication).toBe("string");
  });

  it("suggestPorterImplications gracefully handles missing AI key with realistic domain fallback", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const result = await suggestPorterImplications({
        force: "rivalry",
        content: "حرب أسعار طاحنة بين الشركات القائمة في السوق",
        projectName: "سلسلة مقاهي مختصة",
        industry: "الأغذية والمشروبات",
      });

      expect(result.positiveImplication.length).toBeGreaterThan(10);
      expect(result.negativeImplication.length).toBeGreaterThan(10);
      expect(result.model).toBe("heuristic-fallback");
    } finally {
      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
    }
  });

  it("heuristic force generator produces 4 linked factor triples for each force", () => {
    const forces = generateHeuristicPorterForces({
      title: "تحليل تجريبي",
      projectName: "منصة تعليمية",
      industry: "التعليم الإلكتروني",
      mode: "manual",
    });

    const buyersContent = forces.buyers;
    expect(buyersContent.items).toBeDefined();
    expect(buyersContent.items!.length).toBe(12); // 4 trends + 4 positive + 4 negative

    const trends = buyersContent.items!.filter((i) => i.field === "trends");
    const pos = buyersContent.items!.filter((i) => i.field === "positiveImpacts");
    const neg = buyersContent.items!.filter((i) => i.field === "negativeImpacts");

    expect(trends.length).toBe(4);
    expect(pos.length).toBe(4);
    expect(neg.length).toBe(4);

    // Each positive and negative must be linked to a trend
    for (const p of pos) {
      expect(p.parentFactorId).toBeDefined();
      expect(trends.some((t) => t.id === p.parentFactorId)).toBe(true);
    }
    for (const n of neg) {
      expect(n.parentFactorId).toBeDefined();
      expect(trends.some((t) => t.id === n.parentFactorId)).toBe(true);
    }
  });

  it("simulates cascade delete of trend and its linked implications", () => {
    const trendId = "trend-101";
    const items: PorterFactorItem[] = [
      { id: trendId, force: "suppliers", field: "trends", content: "احتكار الموردين للقطع الأساسية", sortOrder: 1 },
      { id: "pos-1", force: "suppliers", field: "positiveImpacts", content: "إمكانية إبرام عقود طويلة الأجل", parentFactorId: trendId, sortOrder: 1 },
      { id: "neg-1", force: "suppliers", field: "negativeImpacts", content: "ضعف الموقف التفاوضي للشركة", parentFactorId: trendId, sortOrder: 1 },
      { id: "trend-102", force: "suppliers", field: "trends", content: "توفر بدائل محلية للمواد الخام", sortOrder: 2 },
      { id: "pos-2", force: "suppliers", field: "positiveImpacts", content: "تقليل تكاليف الاستيراد", parentFactorId: "trend-102", sortOrder: 2 },
    ];

    // Cascade delete of trend-101
    const remaining = items.filter((item) => item.id !== trendId && item.parentFactorId !== trendId);

    expect(remaining.length).toBe(2);
    expect(remaining.some((i) => i.id === trendId)).toBe(false);
    expect(remaining.some((i) => i.id === "pos-1")).toBe(false);
    expect(remaining.some((i) => i.id === "neg-1")).toBe(false);
    expect(remaining.some((i) => i.id === "trend-102")).toBe(true);
    expect(remaining.some((i) => i.id === "pos-2")).toBe(true);
  });

  it("identifies missing negative implication and reorders correctly after quick add", () => {
    const trendId = "trend-1";
    const trend = { id: trendId, force: "substitutes" as const, field: "trends" as const };
    const pos = { id: "pos-1", force: "substitutes" as const, field: "positiveImpacts" as const, parentFactorId: trendId, sortOrder: 1 };

    const missing = findMissingPorterImplications(trendId, [pos]);
    expect(missing).toEqual({ missingPositive: false, missingNegative: true });

    // Quick add missing negative implication
    const neg = { id: "neg-1", force: "substitutes" as const, field: "negativeImpacts" as const, parentFactorId: trendId, sortOrder: 1 };
    const rechecked = findMissingPorterImplications(trendId, [pos, neg]);
    expect(rechecked).toEqual({ missingPositive: false, missingNegative: false });

    const orderedNegs = orderPorterImplications([neg], [trend]);
    expect(orderedNegs[0].id).toBe("neg-1");
  });
});
