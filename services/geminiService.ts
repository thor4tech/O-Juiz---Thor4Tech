import { GoogleGenAI, Type } from "@google/genai";
import { MeetingAnalysis } from "../types";

// --- MODELS CONFIGURATION ---
// 1. Transcription Model: Fast, cheap, capable of audio processing.
const TRANSCRIPTION_MODEL = "gemini-2.5-flash"; 

// 2. Intelligence Model: High reasoning, "Pro" tier for Action Plan generation.
const INTELLIGENCE_MODEL = "gemini-3-pro-preview";

// --- PROMPTS ---

const TRANSCRIPTION_PROMPT = `
Transcreva o áudio fornecido LITERALMENTE, palavra por palavra, em Português.
Não resuma. Não adicione notas. Apenas retorne o texto cru do que foi falado.
`;

const ANALYSIS_PROMPT = `
Você é o 'Thor4Tech Brain', uma IA analista de negócios sênior.
Analise a seguinte transcrição de uma reunião de negócios.

Gere uma análise estratégica estruturada.
O output deve ser APENAS um JSON válido.

Schema Obrigatório:
{
  "title_sugestion": "Um título curto e profissional para a reunião",
  "summary": "Resumo executivo em 3 frases, focado em decisões e dinheiro.",
  "priority": "Alta" | "Média" | "Baixa" | "Urgente",
  "sentiment": "Positivo" | "Neutro" | "Negativo" | "Preocupado" | "Empolgado",
  "participants_detected": ["Lista de nomes ou cargos inferidos"],
  "main_topics": ["Tópico 1", "Tópico 2"],
  "action_plan": [
    {
      "task": "Ação a ser realizada (Verbo no Imperativo)",
      "owner": "Responsável sugerido (ou 'A Definir')",
      "deadline": "Prazo mencionado ou 'Não definido'"
    }
  ],
  "full_transcription": "Mantenha este campo vazio, pois já tenho a transcrição separada."
}
`;

const getApiKey = () => {
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
         process.env.GEMINI_API_KEY || 
         process.env.API_KEY || 
         localStorage.getItem('thor4tech_gemini_key');
}

/**
 * Step 1: Transcribe Audio using Gemini Flash
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key do Gemini não encontrada (Env ou Settings).");

  const ai = new GoogleGenAI({ apiKey });

  // Convert Blob to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
  });

  try {
    const response = await ai.models.generateContent({
      model: TRANSCRIPTION_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Data } },
          { text: TRANSCRIPTION_PROMPT }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("Gemini Flash não retornou transcrição.");
    return text;

  } catch (error) {
    console.error("Transcription Failed:", error);
    throw error;
  }
};

/**
 * Step 2: Generate Intelligence using Gemini Pro
 */
export const generateActionPlan = async (transcription: string): Promise<MeetingAnalysis> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key do Gemini não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: INTELLIGENCE_MODEL,
      contents: {
        parts: [
          { text: `TRANSCRIPTION:\n${transcription}` },
          { text: ANALYSIS_PROMPT }
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
            participants_detected: { type: Type.ARRAY, items: { type: Type.STRING } },
            main_topics: { type: Type.ARRAY, items: { type: Type.STRING } },
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
            full_transcription: { type: Type.STRING } // This might be empty from the prompt, we fill it later
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Gemini Pro não retornou análise.");
    
    const analysis = JSON.parse(text) as MeetingAnalysis;
    // Inject the full transcription back into the object
    analysis.full_transcription = transcription;
    
    return analysis;

  } catch (error) {
    console.error("Intelligence Analysis Failed:", error);
    throw error;
  }
};