
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, TailoredResumeResponse } from "../types";

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async deepTailorResume(resumeData: ResumeData, jobDescription: string): Promise<TailoredResumeResponse> {
    const ai = this.getClient();
    const prompt = `
      Act as a high-end ATS Optimization Expert. Analyze the Resume against the Job Description.
      
      TASK:
      1. Calculate Match Score (0-100).
      2. Rewrite Objective Summary with JD-specific keywords.
      3. Identify missing critical industry keywords from JD.
      4. Suggest optimized skills categories.
      5. Rewrite Experience bullets for impact, ensuring they target JD requirements.
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      CURRENT RESUME DATA:
      ${JSON.stringify(resumeData)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchScore: { type: Type.NUMBER },
              optimizedSummary: { type: Type.STRING },
              missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              optimizedSkills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              optimizedExperience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    tailoredBullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            },
            required: ["matchScore", "optimizedSummary", "optimizedSkills", "optimizedExperience", "missingKeywords"]
          }
        }
      });
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (error: any) {
      console.error("Tailoring Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
