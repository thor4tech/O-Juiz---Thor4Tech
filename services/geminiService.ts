import { GoogleGenAI, Type } from "@google/genai";
import { MeetingAnalysis } from "../types";

// Using gemini-2.5-flash as the modern replacement for 1.5-flash in this SDK
const MODEL_NAME = "gemini-2.5-flash"; 

const SYSTEM_PROMPT = `
Você é o 'Thor4Tech Brain', uma IA analista de negócios.
Analise o áudio fornecido desta reunião.
Sua tarefa é transcrever o conteúdo E gerar uma análise estruturada.

Retorne APENAS um objeto JSON válido seguindo estritamente este schema.
O JSON deve estar em Português (Brasil).

Schema:
{
  "title_sugestion": "Um título curto e profissional para a reunião",
  "summary": "Resumo executivo em 3 frases",
  "priority": "Alta" | "Média" | "Baixa" | "Urgente",
  "sentiment": "Positivo" | "Neutro" | "Negativo" | "Preocupado" | "Empolgado",
  "participants_detected": ["Lista de nomes ou cargos prováveis"],
  "main_topics": ["Tópico 1", "Tópico 2"],
  "action_plan": [
    {
      "task": "Ação a ser realizada",
      "owner": "Responsável sugerido",
      "deadline": "Prazo mencionado ou 'ASAP'"
    }
  ],
  "full_transcription": "A transcrição completa e literal de tudo que foi dito no áudio."
}
`;

export const analyzeMeetingAudio = async (audioBlob: Blob): Promise<MeetingAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Convert Blob to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
  });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/webm',
              data: base64Data
            }
          },
          {
            text: SYSTEM_PROMPT
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title_sugestion: { type: Type.STRING },
            summary: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["Baixa", "Média", "Alta", "Urgente"] },
            sentiment: { type: Type.STRING, enum: ["Positivo", "Neutro", "Negativo", "Preocupado", "Empolgado"] },
            participants_detected: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            main_topics: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            action_plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  owner: { type: Type.STRING },
                  deadline: { type: Type.STRING }
                }
              }
            },
            full_transcription: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as MeetingAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};