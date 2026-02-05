
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, TailoredResumeResponse } from "../types";

export class GeminiService {
  private getClient() {
    // API KEY provided by the user
    const apiKey = """Enter your API key here""";
    return new GoogleGenAI({ apiKey });
  }

  async deepTailorResume(resumeData: ResumeData, jobDescription: string): Promise<TailoredResumeResponse> {
    const ai = this.getClient();
    
    // Using gemini-3-pro-preview for complex reasoning tasks as specified in coding guidelines
    const model = 'gemini-3-pro-preview';

    const prompt = `
      Act as a high-end Applicant Tracking System (ATS) Specialist. 
      Analyze the provided Resume against the Job Description to tailor it for maximum impact.
      
      CRITICAL INSTRUCTIONS:
      1. Calculate a realistic Match Score (0-100).
      2. Rewrite the Professional Summary to include specific keywords from the JD.
      3. Identify missing critical industry keywords that the user should have.
      4. Suggest optimized skills categories based on the JD.
      5. Tailor Experience bullet points to highlight skills mentioned in the JD while keeping the context of the original experience.
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      USER RESUME DATA:
      ${JSON.stringify(resumeData)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchScore: { type: Type.NUMBER, description: "Percentage score" },
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

      const text = response.text;
      if (!text) throw new Error("Empty response from AI engine.");
      
      return JSON.parse(text);
    } catch (error: any) {
      console.error("Tailoring Engine Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
