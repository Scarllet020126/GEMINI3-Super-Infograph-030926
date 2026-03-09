import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runIngestion(article: string, model: string, prompt: string) {
  const response = await ai.models.generateContent({
    model,
    contents: `${prompt}\n\nArticle:\n${article}`,
  });
  return response.text;
}

export async function runExtraction(cleanedText: string, model: string, prompt: string) {
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        topic_id: { type: Type.STRING },
        title_en: { type: Type.STRING },
        title_zh: { type: Type.STRING },
        summary_en: { type: Type.STRING },
        summary_zh: { type: Type.STRING },
        why_it_matters_en: { type: Type.ARRAY, items: { type: Type.STRING } },
        why_it_matters_zh: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["topic_id", "title_en", "title_zh", "summary_en", "summary_zh"]
    }
  };
  const response = await ai.models.generateContent({
    model,
    contents: `${prompt}\n\nCleaned Text:\n${cleanedText}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.2,
    }
  });
  return JSON.parse(response.text || '[]');
}

export async function runPlanning(topics: any[], model: string, prompt: string) {
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        topic_id: { type: Type.STRING },
        title_en: { type: Type.STRING },
        title_zh: { type: Type.STRING },
        summary_en: { type: Type.STRING },
        summary_zh: { type: Type.STRING },
        why_it_matters_en: { type: Type.ARRAY, items: { type: Type.STRING } },
        why_it_matters_zh: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggested_infographic_type: { type: Type.STRING },
        data: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT,
            properties: {
              label_en: { type: Type.STRING },
              label_zh: { type: Type.STRING },
              value_en: { type: Type.STRING },
              value_zh: { type: Type.STRING }
            }
          } 
        }
      },
      required: ["topic_id", "title_en", "title_zh", "summary_en", "summary_zh", "suggested_infographic_type", "data"]
    }
  };
  const response = await ai.models.generateContent({
    model,
    contents: `${prompt}\n\nTopics JSON:\n${JSON.stringify(topics)}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.2,
    }
  });
  return JSON.parse(response.text || '[]');
}

export async function runQA(topicsWithData: any[], model: string, prompt: string) {
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      topics: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic_id: { type: Type.STRING },
            title_en: { type: Type.STRING },
            title_zh: { type: Type.STRING },
            summary_en: { type: Type.STRING },
            summary_zh: { type: Type.STRING },
            why_it_matters_en: { type: Type.ARRAY, items: { type: Type.STRING } },
            why_it_matters_zh: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggested_infographic_type: { type: Type.STRING },
            data: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  label_en: { type: Type.STRING },
                  label_zh: { type: Type.STRING },
                  value_en: { type: Type.STRING },
                  value_zh: { type: Type.STRING }
                }
              } 
            }
          },
          required: ["topic_id", "title_en", "title_zh", "summary_en", "summary_zh", "suggested_infographic_type", "data"]
        }
      },
      follow_up_questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question_en: { type: Type.STRING },
            question_zh: { type: Type.STRING }
          }
        }
      }
    },
    required: ["topics", "follow_up_questions"]
  };
  const response = await ai.models.generateContent({
    model,
    contents: `${prompt}\n\nTopics with Data JSON:\n${JSON.stringify(topicsWithData)}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.2,
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function generateAudioSummary(topics: any[]) {
  const textToSay = `Here is your executive summary of the extracted topics. We have identified several key areas including: ${topics.slice(0, 5).map(t => t.title_en).join(', ')}. Please review the full interactive webpage for detailed infographics on all 30 topics.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: textToSay }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export async function generateSocialThread(topics: any[], model: string) {
  const prompt = `Create an engaging 5-part Twitter/LinkedIn thread highlighting the most important insights from these topics. Use emojis and a professional tone.`;
  const response = await ai.models.generateContent({
    model,
    contents: `${prompt}\n\nTopics:\n${JSON.stringify(topics.slice(0, 10))}`,
  });
  return response.text;
}

export async function factCheckTopics(topics: any[], model: string) {
  const prompt = `Fact-check the following top 3 topics using Google Search. Provide a brief verification status for each.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', // Force a model that supports search
    contents: `${prompt}\n\nTopics:\n${JSON.stringify(topics.slice(0, 3))}`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
}
