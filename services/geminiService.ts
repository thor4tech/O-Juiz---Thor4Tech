
import { GoogleGenAI, Type } from "@google/genai";
import { MeetingAnalysis } from "../types";

// --- ESTRATÉGIA DE CUSTO E INTELIGÊNCIA ---
// Flash: Para transcrição (rápido, barato, janela de contexto grande)
// Pro: Para raciocínio complexo e geração do JSON
const MODEL_TRANSCRIPTION = "gemini-1.5-flash"; 
const MODEL_INTELLIGENCE = "gemini-1.5-pro";

const getApiKey = () => {
  // Tenta ler variaveis publicas ou privadas (conforme print)
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Chave de API do Gemini não configurada no Vercel.");
  }
  return key;
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  // Converter Blob para Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove o cabeçalho "data:audio/webm;base64,"
      const base64 = result.split(',')[1]; 
      resolve(base64);
    };
    reader.onerror = reject;
  });

  try {
    // Chamada leve para transcrição
    const response = await ai.models.generateContent({
      model: MODEL_TRANSCRIPTION,
      contents: {
        parts: [
          { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Data } },
          { text: "Transcreva este áudio literalmente. Apenas o texto, sem formatação markdown." }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("A transcrição retornou vazia.");
    return text;

  } catch (error) {
    console.error("Erro na Transcrição (Flash):", error);
    throw new Error("Falha ao transcrever o áudio. Verifique a chave API ou o formato do arquivo.");
  }
};

export const generateActionPlan = async (transcription: string): Promise<MeetingAnalysis> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const PROMPT_BRAIN = `
    Você é o Thor4Tech Brain (O Juiz). Analise esta transcrição de reunião.
    Gere uma análise JSON estrita.
    
    Schema:
    {
      "title_sugestion": "Título curto",
      "summary": "Resumo executivo",
      "priority": "Alta" | "Média" | "Baixa" | "Urgente",
      "sentiment": "Positivo" | "Neutro" | "Negativo",
      "participants_detected": ["Nomes"],
      "main_topics": ["Tópicos"],
      "action_plan": [{"task": "Ação", "owner": "Nome", "deadline": "Prazo"}]
    }
  `;

  try {
    // Chamada pesada para inteligência
    const response = await ai.models.generateContent({
      model: MODEL_INTELLIGENCE,
      contents: {
        parts: [
          { text: `TRANSCRIPTION:\n${transcription}` },
          { text: PROMPT_BRAIN }
        ]
      },
      config: {
        responseMimeType: "application/json",
        // Schema tipado para garantir o JSON correto
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
            full_transcription: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("A análise retornou vazia.");
    
    const json = JSON.parse(text) as MeetingAnalysis;
    // Injeta a transcrição original no objeto final para salvar tudo junto
    json.full_transcription = transcription;
    
    return json;

  } catch (error) {
    console.error("Erro na Análise (Pro):", error);
    throw new Error("Falha ao gerar inteligência. O modelo pode estar sobrecarregado.");
  }
};
