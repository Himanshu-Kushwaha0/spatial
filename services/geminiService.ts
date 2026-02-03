
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, TailoredResumeResponse } from "../types";

export class GeminiService {
  private getClient() {
    // Re-initialize to ensure the latest API key from environment is used
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async parseResume(rawText: string): Promise<Partial<ResumeData>> {
    const ai = this.getClient();
    const prompt = `
      Act as an expert resume parser. Extract the following information from the provided text and format it into a structured JSON object.
      Include: Contact Info, Summary, Work Experience, Education, and Skills.
      
      Raw Resume Text:
      ${rawText}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              contact: {
                type: Type.OBJECT,
                properties: {
                  fullName: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  location: { type: Type.STRING },
                  linkedin: { type: Type.STRING },
                  github: { type: Type.STRING },
                }
              },
              summary: { type: Type.STRING },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    isCurrent: { type: Type.BOOLEAN },
                    description: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    school: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING }
                  }
                }
              },
              skillCategories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      
      if (parsed.experience) parsed.experience = parsed.experience.map((e: any) => ({ ...e, id: Math.random().toString(36).substr(2, 9) }));
      if (parsed.education) parsed.education = parsed.education.map((e: any) => ({ ...e, id: Math.random().toString(36).substr(2, 9) }));
      if (parsed.skillCategories) parsed.skillCategories = parsed.skillCategories.map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
      
      return parsed;
    } catch (error: any) {
      console.error("Parse Error:", error);
      throw error;
    }
  }

  async deepTailorResume(resumeData: ResumeData, jobDescription: string): Promise<TailoredResumeResponse> {
    const ai = this.getClient();
    const prompt = `
      Act as a high-end ATS Optimization Expert. Analyze the Resume against the Job Description.
      
      TASK:
      1. Calculate Match Score (0-100).
      2. Rewrite Summary with JD keywords.
      3. Identify missing keywords.
      4. Rewrite Experience bullets for impact.
      
      JD: ${jobDescription}
      RESUME: ${JSON.stringify(resumeData)}
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
