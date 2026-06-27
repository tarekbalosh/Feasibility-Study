import { logger } from "../utils/logger";

interface FeasibilityInput {
  name: string;
  industry: string;
  location: string;
  description: string;
  targetCapital: number;
  financialInputs: Record<string, any>;
}

/**
 * OpenAI Service — توليد تحليل دراسة الجدوى بالذكاء الاصطناعي
 *
 * حالياً يعيد بيانات وهمية (mock) مُنظمة.
 * جاهز لربطه بـ OpenAI API عند إضافة المفتاح.
 */
export async function generateFeasibilityAnalysis(
  input: FeasibilityInput
): Promise<Record<string, any>> {
  logger.info(`Generating AI analysis for project: ${input.name}`);

  // TODO: Replace with actual OpenAI API call
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     { role: "system", content: SYSTEM_PROMPT },
  //     { role: "user", content: buildPrompt(input) },
  //   ],
  //   response_format: { type: "json_object" },
  // });

  // Mock AI output matching the api-design.md format
  const mockOutput = {
    marketAnalysis: `يتميز قطاع ${input.industry} في ${input.location} بنمو ملحوظ. فكرة "${input.name}" تستهدف شريحة واعدة من السوق مع فرص نمو جيدة بناءً على التحليل الأولي للسوق المحلي.`,
    competitors: [
      {
        name: "منافس رئيسي 1",
        strengths: "تغطية واسعة وخبرة طويلة",
        weaknesses: "أسعار مرتفعة وتجربة مستخدم قديمة",
      },
      {
        name: "منافس رئيسي 2",
        strengths: "جودة خدمة عالية",
        weaknesses: "نطاق جغرافي محدود",
      },
    ],
    swotAnalysis: {
      strengths:
        "تكلفة تأسيسية مناسبة مع رأس مال مستهدف يبلغ " +
        input.targetCapital +
        " ريال.",
      weaknesses: "مشروع جديد بدون قاعدة عملاء مسبقة.",
      opportunities:
        "نمو السوق الرقمي وزيادة الطلب على الخدمات الإلكترونية في " +
        input.location +
        ".",
      threats:
        "سهولة دخول منافسين جدد وتقلبات السوق الاقتصادية.",
    },
    recommendations: [
      "التركيز على التسويق الرقمي في المرحلة الأولى.",
      "بناء شراكات استراتيجية مع موردين محليين.",
      "تقديم عروض تنافسية لجذب العملاء الأوائل.",
    ],
  };

  logger.info(`AI analysis generated successfully for: ${input.name}`);
  return mockOutput;
}

// ——— Prompt Template (for future OpenAI integration) ———
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildPrompt(input: FeasibilityInput): string {
  return `
أنت خبير في دراسات الجدوى الاقتصادية. قم بتحليل المشروع التالي وأعد تقريراً مفصلاً بصيغة JSON:

اسم المشروع: ${input.name}
القطاع: ${input.industry}
الموقع: ${input.location}
الوصف: ${input.description}
رأس المال المستهدف: ${input.targetCapital}
البيانات المالية: ${JSON.stringify(input.financialInputs)}

أعد الاستجابة بهيكل JSON التالي:
{
  "marketAnalysis": "تحليل السوق...",
  "competitors": [{"name": "...", "strengths": "...", "weaknesses": "..."}],
  "swotAnalysis": {"strengths": "...", "weaknesses": "...", "opportunities": "...", "threats": "..."},
  "recommendations": ["توصية 1", "توصية 2"]
}
  `.trim();
}
