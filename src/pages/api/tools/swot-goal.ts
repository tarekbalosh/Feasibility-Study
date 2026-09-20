import type { NextApiRequest, NextApiResponse } from "next"
import OpenAI from "openai"
import { openAIConfig } from "@/config/openai.config"
import { requireWorkspaceApi } from "@/lib/requireWorkspaceApi"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ message: "الطريقة غير مسموحة" })
  }

  // Check workspace auth
  const workspace = await requireWorkspaceApi(req, res)
  if (!workspace) return

  const { quadrantKey, itemTitle, itemDetail } = req.body

  if (!quadrantKey || !itemTitle) {
    return res.status(400).json({ message: "بيانات غير مكتملة" })
  }

  const quadrantRules: Record<string, string> = {
    strengths: "الهدف يجب أن يركز على الحفاظ على نقطة القوة هذه أو تعزيزها واستغلالها.",
    weaknesses: "الهدف يجب أن يركز على علاج نقطة الضعف هذه أو التخلص منها.",
    opportunities: "الهدف يجب أن يركز على استثمار هذه الفرصة والاستفادة منها لصالح الشركة.",
    threats: "الهدف يجب أن يركز على تجنب هذا الخطر أو التقليل من آثاره.",
  }

  const rule = quadrantRules[quadrantKey] || ""

  const prompt = `أنت مستشار أعمال استراتيجي.
بناءً على القاعدة التالية: ${rule}
قم بكتابة "هدف استراتيجي" تنفيذي واحد ومباشر يتناسب بدقة مع النقطة المحددة أدناه لتكون في خطة العمل.
النقطة: ${itemTitle}
${itemDetail ? `التفاصيل: ${itemDetail}` : ""}

شروط الهدف:
- جملة واحدة فقط واضحة وقابلة للتنفيذ المباشر.
- لا تكرر اسم النقطة حرفيا، بل استخدم معناها لبناء هدف حقيقي.
- يبدأ بفعل أو مصدر (مثل: زيادة، تطوير، التعاقد، الحد، تقليل، تصميم، تدريب).
- لا يحتوي على مقدمات أو شروحات أو أرقام، فقط الهدف الاستراتيجي الصافي.`

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: openAIConfig.timeout,
    })

    const response = await client.chat.completions.create({
      model: openAIConfig.model,
      temperature: 0.7,
      max_tokens: 150,
      messages: [
        { role: "system", content: "أنت مستشار استراتيجي يجيب بجملة واحدة فقط." },
        { role: "user", content: prompt }
      ]
    })

    let goal = response.choices?.[0]?.message?.content?.trim() || ""
    
    // Clean up if AI adds quotes or markdown
    goal = goal.replace(/^["']|["']$/g, '').trim()

    return res.status(200).json({ goal })
  } catch (error) {
    console.error("[ERROR] SWOT goal generation failed", error)
    return res.status(500).json({ message: "تعذر توليد الهدف حاليا." })
  }
}
