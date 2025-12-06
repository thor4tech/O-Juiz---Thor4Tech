
import { GoogleGenAI, Type } from "@google/genai";
import { MeetingAnalysis } from "../types";

// --- STRATEGY: HYBRID INTELLIGENCE ---
const MODEL_TRANSCRIPTION = "gemini-1.5-flash"; 
const MODEL_INTELLIGENCE = "gemini-1.5-pro";

const getApiKey = () => {
  // 1. Try LocalStorage Override
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('THOR_OVERRIDE_GEMINI_API_KEY');
    if (local) return local;
  }

  // 2. Try Env Vars
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
              process.env.GEMINI_API_KEY || 
              process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!key) {
    console.error("❌ CRITICAL: Gemini API Key missing.");
    throw new Error("Chave de API do Gemini não encontrada. Configure no Painel de Sistema (Modo de Resgate) ou Variáveis de Ambiente.");
  }
  return key;
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    // 1. Convert Blob to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove "data:audio/webm;base64," header
        const base64 = result.split(',')[1]; 
        resolve(base64);
      };
      reader.onerror = reject;
    });

    console.log(`[Gemini Flash] Transcribing ${audioBlob.size} bytes...`);

    // 2. Call Gemini Flash
    const response = await ai.models.generateContent({
      model: MODEL_TRANSCRIPTION,
      contents: {
        parts: [
          { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Data } },
          { text: "Transcreva este áudio literalmente. Apenas o texto puro, sem formatação, sem timestamps." }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("A transcrição retornou vazia.");
    
    return text;

  } catch (error: any) {
    console.error("Erro na Transcrição (Flash):", error);
    throw new Error(`Falha na Transcrição: ${error.message || 'Erro desconhecido'}`);
  }
};

export const generateActionPlan = async (transcription: string): Promise<MeetingAnalysis> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const PROMPT_BRAIN = `
      Você é o Thor4Tech Brain. Analise a transcrição abaixo.
      Retorne APENAS um JSON válido seguindo este schema estrito:
      
      {
        "title_sugestion": "Título curto e profissional",
        "summary": "Resumo executivo (max 3 linhas)",
        "priority": "Alta" | "Média" | "Baixa" | "Urgente",
        "sentiment": "Positivo" | "Neutro" | "Negativo",
        "participants_detected": ["Lista de nomes"],
        "main_topics": ["Tópico 1", "Tópico 2"],
        "action_plan": [{"task": "Ação", "owner": "Responsável", "deadline": "Prazo"}]
      }
    `;

    console.log(`[Gemini Pro] Analyzing ${transcription.length} characters...`);

    const response = await ai.models.generateContent({
      model: MODEL_INTELLIGENCE,
      contents: {
        parts: [
          { text: `CONTEXTO (Transcrição):\n${transcription}` },
          { text: PROMPT_BRAIN }
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
            sentiment: { type: Type.STRING, enum: ["Positivo", "Neutro", "Negativo"] },
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
            full_transcription: { type: Type.STRING } // Helper field
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("A análise retornou vazia.");
    
    const json = JSON.parse(text) as MeetingAnalysis;
    json.full_transcription = transcription; 
    
    return json;

  } catch (error: any) {
    console.error("Erro na Análise (Pro):", error);
    throw new Error(`Falha na Inteligência: ${error.message}`);
  }
};
