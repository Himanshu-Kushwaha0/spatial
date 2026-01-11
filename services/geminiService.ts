
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, AIAnalysisRequest, TailoredResumeResponse } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async parseResume(rawText: string): Promise<Partial<ResumeData>> {
    const prompt = `
      Act as an expert resume parser. Extract the following information from the provided text and format it into a structured JSON object.
      Include: Contact Info, Summary, Work Experience, Education, and Skills.
      
      Raw Resume Text:
      ${rawText}
    `;

    try {
      const response = await this.ai.models.generateContent({
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

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.experience) parsed.experience = parsed.experience.map((e: any) => ({ ...e, id: Math.random().toString(36).substr(2, 9) }));
      if (parsed.education) parsed.education = parsed.education.map((e: any) => ({ ...e, id: Math.random().toString(36).substr(2, 9) }));
      if (parsed.skillCategories) parsed.skillCategories = parsed.skillCategories.map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
      return parsed;
    } catch (error) {
      console.error("Gemini parsing error:", error);
      throw error;
    }
  }

  async deepTailorResume(resumeData: ResumeData, jobDescription: string): Promise<TailoredResumeResponse> {
    const prompt = `
      Act as a high-end ATS Optimization Expert. 
      Analyze the Resume against the Job Description.
      
      TASK:
      1. Calculate a current Match Score (0-100).
      2. Rewrite the Summary to include top JD keywords.
      3. Identify missing keywords and reorganize Skill Categories to include them.
      4. Rewrite bullet points for each Experience entry to emphasize relevant achievements that match the JD requirements.
      
      JD: ${jobDescription}
      RESUME: ${JSON.stringify(resumeData)}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Deep Tailor error:", error);
      throw error;
    }
  }

  async calculateATSScore(resumeData: ResumeData, jobDescription: string): Promise<{
    score: number;
    missingKeywords: string[];
    improvements: string[];
  }> {
    const prompt = `
      Analyze the following Resume vs Job Description for ATS compatibility.
      Score it 0-100. Provide missing keywords and formatting improvements.

      Resume: ${JSON.stringify(resumeData)}
      Job Description: ${jobDescription}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["score", "missingKeywords", "improvements"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("ATS Score error:", error);
      return { score: 0, missingKeywords: [], improvements: [] };
    }
  }
}

export const geminiService = new GeminiService();
