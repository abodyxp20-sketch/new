
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : (import.meta as any).env.VITE_GEMINI_API_KEY;
console.log("Gemini API Key status:", !!apiKey);
const ai = new GoogleGenAI({ apiKey: apiKey || "AI_KEY_NOT_FOUND" });

// Advanced AI Engine: Multi-layered stability and neural fallback logic
export const analyzeItemImage = async (base64Image: string) => {
  const maxRetries = 2;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            {
              text: `You are a strict school-safety moderation engine for student platform Ataa.

Rules (MUST ENFORCE):
1) If image includes adult/sexual content, nudity, suggestive content, violence, blood, weapons, drugs, cigarettes/vapes/tobacco/alcohol, hate symbols, abusive/offensive gestures, or dangerous illegal activity => isSafe false.
2) If image is non-educational but harmless, still allow only if it can reasonably be used in school sharing context.
3) If uncertain, choose safety-first and return isSafe false.
4) When blocked, provide blockReason in user-friendly terms.
5) Output JSON only.`
            }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSafe: { type: Type.BOOLEAN },
              blockReason: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              condition: { type: Type.STRING },
              qualityScore: { type: Type.NUMBER }
            },
            required: ['isSafe', 'confidence', 'name', 'description', 'category', 'condition', 'qualityScore']
          }
        }
      });

      const parsed = JSON.parse(response.text.trim() || '{}');

      if (parsed.isSafe === false) {
        return {
          isSafe: false,
          blockReason: parsed.blockReason || 'Inappropriate or unsafe content for students.',
          confidence: parsed.confidence ?? 0.9,
          name: '',
          category: 'Other',
          description: '',
          condition: 'Good',
          qualityScore: 0,
        };
      }

      return {
        isSafe: true,
        blockReason: '',
        confidence: parsed.confidence ?? 0.8,
        name: parsed.name || 'Educational Item',
        category: parsed.category || 'Other',
        description: parsed.description || 'School-appropriate item for student exchange.',
        condition: parsed.condition || 'Good',
        qualityScore: Number.isFinite(parsed.qualityScore) ? parsed.qualityScore : 70,
      };
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
    }
  }

  // Safety-first fallback: do not auto-approve when AI cannot verify.
  return {
    isSafe: false,
    blockReason: 'We could not verify this image safely. Please upload a clearer educational item photo.',
    confidence: 0,
    name: '',
    category: 'Other',
    description: '',
    condition: 'Good',
    qualityScore: 0
  };
};

/**
 * AI Semantic Search: Maps human needs to specific marketplace filters.
 * E.g., "I'm cold" -> Uniforms (Sweaters)
 */
export const performSemanticSearch = async (query: string, language: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User says: "${query}". 
      From these categories: [Stationery, Electronics, Books, Uniforms, Art Supplies, Other], 
      which one fits best? Also suggest 3 keywords for items. 
      Language: ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (err) {
    return { category: 'All', keywords: [] };
  }
};

/**
 * AI Admin Insights: Summarizes community activity and flags risks.
 */
export const getAdminInsights = async (itemsJson: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these school items: ${itemsJson}. 
      What is the most needed category? Any suspicious patterns? 
      Provide a brief summary for a teacher.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            topNeed: { type: Type.STRING },
            riskLevel: { type: Type.STRING, description: "Low, Medium, High" }
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (err) {
    return null;
  }
};

export const askAtaaAssistant = async (prompt: string, language: string, context?: string) => {
  const trimmed = prompt.trim();
  const lowerPrompt = trimmed.toLowerCase();

  const quickReplies: Record<string, Record<string, string>> = {
    ar: {
      hello: 'أهلاً بك 👋 كيف أساعدك في البحث أو النشر في عطاء؟',
      help: 'أكيد! قل لي ماذا تحتاج: نشر أداة، طلب استعارة، أو التواصل مع المانح.'
    },
    en: {
      hello: 'Hi 👋 How can I help you with posting or finding items on Ataa?',
      help: 'Sure! Tell me what you need: post an item, request borrowing, or contact a donor.'
    }
  };

  if (quickReplies[language]?.[lowerPrompt]) return quickReplies[language][lowerPrompt];

  const wantsDetailed = /explain|details|step by step|why|كيف|اشرح|تفاصيل|خطوة/.test(trimmed);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${trimmed}

Context: ${context || 'Ataa school marketplace app.'}`,
      config: {
        systemInstruction: `You are Ataa Assistant for students.
- Language must be ${language === 'ar' ? 'Arabic' : 'English'} only.
- Keep answers very simple and clear for students.
- If user asks normal question: answer in 2-4 short lines.
- If user asks for explanation or details: give a simple step-by-step answer (max 7 bullets).
- Be safe and school-appropriate. Refuse harmful/18+ guidance.`
      }
    });

    const answer = response.text?.trim() || '';
    if (!answer) {
      return language === 'ar'
        ? 'ممتاز، أقدر أساعدك بخطوات بسيطة. اكتب سؤالك مرة ثانية بشكل مختصر.'
        : 'I can help with simple steps. Please ask again in one short sentence.';
    }

    if (!wantsDetailed) {
      return answer.split('\n').slice(0, 4).join('\n');
    }

    return answer;
  } catch (error) {
    return language === 'ar'
      ? 'حالياً المساعد في وضع احتياطي. اكتب سؤالك وسأجيبك بسرعة وبشكل مبسط.'
      : 'Assistant is in backup mode right now. Ask your question and I will answer simply and quickly.';
  }
};
