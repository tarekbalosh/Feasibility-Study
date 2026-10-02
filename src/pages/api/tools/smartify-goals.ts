import type { NextApiRequest, NextApiResponse } from "next"
import OpenAI from "openai"
import { openAIConfig } from "@/config/openai.config"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "الطريقة غير مسموحة" })
  }

  const { goals } = req.body

  if (!Array.isArray(goals) || goals.length === 0) {
    return res.status(400).json({ message: "لا توجد أهداف لتحويلها" })
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn("[WARN] OPENAI_API_KEY غير مضبوط — استخدام المولّد القاعدي")
    const fallback = goals.map(g => `${g} بتحقيق تحسن بنسبة 20% خلال 6 أشهر قادمة.`)
    return res.status(200).json({ smartGoals: fallback })
  }

  const prompt = `أنت خبير في التخطيط الاستراتيجي.
لدي قائمة من الأهداف الاستراتيجية، أريدك أن تعيد صياغتها لتصبح أهدافاً ذكية (SMART Goals) بحيث تكون: محددة، قابلة للقياس، قابلة للتحقيق، ذات صلة، ومحددة زمنياً.

أعد الرد بصيغة JSON فقط، يحتوي على مفتاح "smartGoals" ومصفوفة نصية بنفس الترتيب بالضبط.

الأهداف الأصلية:
${goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}
`

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: openAIConfig.timeout,
    })

    const response = await client.chat.completions.create({
      model: openAIConfig.model,
      temperature: 0.5,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "أنت خبير استراتيجي. أجب بـ JSON فقط بالصيغة المطلوبة.",
        },
        { role: "user", content: prompt },
      ],
    })

    const rawContent = response.choices?.[0]?.message?.content?.trim() ?? ""
    const cleaned = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim()
      
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed?.smartGoals)) {
      throw new Error("الاستجابة لا تحتوي على مصفوفة smartGoals")
    }
    
    return res.status(200).json({ smartGoals: parsed.smartGoals })
  } catch (error) {
    console.error("[ERROR] smartify goals failed", error)
    const fallback = goals.map(g => `${g} بتحقيق تحسن بنسبة 20% خلال 6 أشهر قادمة.`)
    return res.status(200).json({ smartGoals: fallback })
  }
}
