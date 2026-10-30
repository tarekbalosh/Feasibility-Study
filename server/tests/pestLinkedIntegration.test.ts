import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/config/prisma";
import { type Actor } from "../src/services/accessService";
import * as pestService from "../src/services/pest/pestService";
import { PEST_DIMENSIONS } from "../src/services/pest/pestConstants";

describe("PEST Linked Factors End-to-End Integration Tests", { timeout: 35000 }, () => {
  let workspaceId: string;
  let userId: string;
  let authorActor: Actor;
  let readOnlyActor: Actor;
  let testAnalysisId: string;

  beforeAll(async () => {
    const ws = await prisma.workspace.findFirst();
    const user = await prisma.user.findFirst();

    if (!ws || !user) {
      throw new Error("Missing test workspace or user in database.");
    }

    workspaceId = ws.id;
    userId = user.id;

    authorActor = {
      userId,
      workspaceId,
      memberId: "m-test-author",
      role: "owner",
      isAdmin: true,
      canWrite: true,
      departmentIds: [],
      headOfDepartmentIds: [],
      planIds: [],
    };

    readOnlyActor = {
      userId: "u-readonly-test",
      workspaceId,
      memberId: "m-test-ro",
      role: "viewer",
      isAdmin: false,
      canWrite: false, // لا يملك صلاحية تعديل
      departmentIds: [],
      headOfDepartmentIds: [],
      planIds: [],
    };

    // إنشاء تحليل تجريبي
    const analysis = await pestService.createAnalysis(authorActor, {
      title: "تحليل PEST للاختبار الشامل للربط",
      projectName: "مشروع الاختبار المتكامل",
      industry: "تقنية معلومات",
      countryRegion: "المملكة العربية السعودية",
    });

    testAnalysisId = analysis.id;
  });

  afterAll(async () => {
    if (testAnalysisId) {
      try {
        await pestService.deleteAnalysis(authorActor, testAnalysisId);
      } catch {
        // ignore if already deleted
      }
    }
  });

  it("1. إضافة بند مع انعكاسين في عملية واحدة لكل بعد من الأبعاد الخمسة", async () => {
    for (const dim of PEST_DIMENSIONS) {
      const res = await pestService.createLinkedFactor(authorActor, testAnalysisId, {
        dimension: dim,
        content: `توجه تجريبي في ${dim}`,
        positiveImplication: `فرصة إيجابية في ${dim}`,
        negativeImplication: `تحدي ومخاطر في ${dim}`,
      });

      expect(res.trend).toBeDefined();
      expect(res.trend.dimension).toBe(dim);
      expect(res.trend.category).toBe("trend");
      expect(res.trend.parentFactorId).toBeNull();

      expect(res.positive).toBeDefined();
      expect(res.positive.dimension).toBe(dim);
      expect(res.positive.category).toBe("positive_impact");
      expect(res.positive.parentFactorId).toBe(res.trend.id);

      expect(res.negative).toBeDefined();
      expect(res.negative.dimension).toBe(dim);
      expect(res.negative.category).toBe("negative_impact");
      expect(res.negative.parentFactorId).toBe(res.trend.id);
    }

    // فحص التحليل كاملاً
    const full = await pestService.getAnalysisWithFactors(authorActor, testAnalysisId);
    expect(full.factorsFlat.length).toBe(15); // 5 أبعاد * 3 بنود

    for (const dim of PEST_DIMENSIONS) {
      const d = full.factors[dim];
      expect(d.trend.length).toBe(1);
      expect(d.positive_impact.length).toBe(1);
      expect(d.negative_impact.length).toBe(1);
      expect(d.positive_impact[0].parentFactorId).toBe(d.trend[0].id);
      expect(d.negative_impact[0].parentFactorId).toBe(d.trend[0].id);
    }
  });

  it("2. فشل الحفظ عند نقص أي حقل ولا يترك بيانات ناقصة", async () => {
    const beforeCount = await prisma.pestFactor.count({ where: { analysisId: testAnalysisId } });

    await expect(
      pestService.createLinkedFactor(authorActor, testAnalysisId, {
        dimension: "political",
        content: "بند ناقص",
        positiveImplication: "",
        negativeImplication: "سلبي",
      })
    ).rejects.toThrow();

    const afterCount = await prisma.pestFactor.count({ where: { analysisId: testAnalysisId } });
    expect(afterCount).toBe(beforeCount); // لم يُنشأ أي سجل
  });

  it("3. يمنع إضافة أكثر من انعكاس من نفس النوع لنفس البند الأب", async () => {
    const full = await pestService.getAnalysisWithFactors(authorActor, testAnalysisId);
    const politicalTrend = full.factors.political.trend[0];

    // محاولة إضافة انعكاس إيجابي ثانٍ لنفس التوجه
    await expect(
      pestService.addImplication(authorActor, testAnalysisId, politicalTrend.id, {
        category: "positive_impact",
        content: "انعكاس إيجابي مكرر",
      })
    ).rejects.toThrow(/مرتبط مسبقاً/);
  });

  it("4. حذف انعكاس منفرد مسموح، ويسمح بعدها بإعادة إضافته سريعاً", async () => {
    const full = await pestService.getAnalysisWithFactors(authorActor, testAnalysisId);
    const economicPos = full.factors.economic.positive_impact[0];
    const economicTrendId = full.factors.economic.trend[0].id;

    // حذف الانعكاس الإيجابي فقط
    await pestService.deleteFactor(authorActor, testAnalysisId, economicPos.id);

    // التأكد من حذفه
    const afterDelete = await pestService.getAnalysisWithFactors(authorActor, testAnalysisId);
    expect(afterDelete.factors.economic.positive_impact.length).toBe(0);
    expect(afterDelete.factors.economic.trend.length).toBe(1);

    // إعادة إضافة انعكاس إيجابي سريعاً
    const added = await pestService.addImplication(authorActor, testAnalysisId, economicTrendId, {
      category: "positive_impact",
      content: "فرصة جديدة تمت إضافتها سريعاً",
    });

    expect(added.factor.parentFactorId).toBe(economicTrendId);

    const afterReadd = await pestService.getAnalysisWithFactors(authorActor, testAnalysisId);
    expect(afterReadd.factors.economic.positive_impact.length).toBe(1);
  });

  it("5. حذف بند التوجه يحذف انعكاسيه المرتبطين به تلقائياً (الحذف المتسلسل)", async () => {
    const full = await pestService.getAnalysisWithFactors(authorActor, testAnalysisId);
    const socialTrend = full.factors.social.trend[0];

    // حذف بند التوجه في البعد الاجتماعي
    const deleteRes = await pestService.deleteFactor(authorActor, testAnalysisId, socialTrend.id);
    expect(deleteRes.success).toBe(true);
    expect(deleteRes.deletedIds.length).toBe(3); // الأب + الانعكاسين

    const afterDelete = await pestService.getAnalysisWithFactors(authorActor, testAnalysisId);
    expect(afterDelete.factors.social.trend.length).toBe(0);
    expect(afterDelete.factors.social.positive_impact.length).toBe(0);
    expect(afterDelete.factors.social.negative_impact.length).toBe(0);
  });

  it("6. مستخدم بلا صلاحية تعديل (canWrite=false) يُرفض طلبه عند محاولة الإضافة أو التعديل", async () => {
    await expect(
      pestService.createLinkedFactor(readOnlyActor, testAnalysisId, {
        dimension: "legal",
        content: "بند غير مصرح به",
        positiveImplication: "إيجابي",
        negativeImplication: "سلبي",
      })
    ).rejects.toThrow();

    await expect(
      pestService.updateFactor(readOnlyActor, testAnalysisId, "fake-id", {
        content: "تعديل غير مصرح",
      })
    ).rejects.toThrow();
  });
});
