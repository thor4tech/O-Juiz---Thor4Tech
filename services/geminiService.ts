
import { GoogleGenAI } from "@google/genai";
import { MeetingAnalysis } from "../types";

const MODEL_NAME = "gemini-1.5-flash";

// Helper para Timeout (Evita looping infinito)
const timeoutPromise = <T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const getClient = () => {
  // Busca a chave diretamente do ambiente Vercel
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Chave API do Gemini não configurada no Vercel.");
  }
  
  if (!apiKey.startsWith("AIza")) {
     throw new Error("Formato da Chave API Gemini inválido.");
  }

  return new GoogleGenAI({ apiKey });
};

const simplifyError = (error: any): never => {
  console.error("[Gemini Service Error]", error);
  
  let msg = error.message || String(error);
  
  // Tradução de erros comuns para mensagens curtas
  if (msg.includes("401") || msg.includes("API key")) msg = "Chave API Inválida.";
  if (msg.includes("403")) msg = "Acesso Negado (Região/Conta).";
  if (msg.includes("404")) msg = "Modelo de IA indisponível.";
  if (msg.includes("429")) msg = "Muitas requisições (Cota excedida).";
  if (msg.includes("500") || msg.includes("503")) msg = "Servidor do Google instável.";
  if (msg.includes("Failed to fetch") || msg.includes("Network")) msg = "Erro de Conexão/Internet.";
  if (msg.includes("safety")) msg = "Conteúdo bloqueado por segurança.";
  if (msg.includes("Timeout")) msg = "A IA demorou muito para responder.";

  throw new Error(msg);
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const ai = getClient();
    
    if (audioBlob.size < 500) throw new Error("Áudio vazio ou corrompido.");

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; 
        if (!base64) reject(new Error("Falha na conversão Base64"));
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Erro ao ler áudio."));
    });

    // MIME Type seguro
    const mimeType = audioBlob.type.includes('wav') ? 'audio/wav' : 'audio/webm';

    console.log(`[Gemini] Iniciando transcrição (${(audioBlob.size / 1024).toFixed(0)}KB)...`);

    // Timeout de 45 segundos para transcrição
    const response = await timeoutPromise(
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType, data: base64Data } },
            { text: "Transcreva este áudio fielmente. Se for apenas ruído, responda '[Ruído]'." }
          ]
        }
      }),
      45000,
      "Timeout: Transcrição demorou demais."
    );

    const text = response.text;
    if (!text) throw new Error("IA retornou texto vazio.");
    
    return text;

  } catch (error: any) {
    simplifyError(error);
    return "";
  }
};

export const generateActionPlan = async (transcription: string): Promise<MeetingAnalysis> => {
  try {
    const ai = getClient();
    
    if (!transcription || transcription.length < 5) {
        throw new Error("Texto insuficiente para análise.");
    }

    const PROMPT = `
      Analise a seguinte transcrição de reunião.
      Retorne APENAS um JSON válido (sem markdown, sem explicações) seguindo este formato exato:
      {
        "title_sugestion": "Título Resumido",
        "summary": "Resumo executivo curto",
        "priority": "Alta" | "Média" | "Baixa" | "Urgente",
        "sentiment": "Positivo" | "Neutro" | "Negativo",
        "participants_detected": ["Nome1", "Nome2"],
        "main_topics": ["Tópico 1", "Tópico 2"],
        "action_plan": [{"task": "Ação", "owner": "Responsável", "deadline": "Prazo"}]
      }
    `;

    console.log(`[Gemini] Iniciando análise inteligente...`);

    // Timeout de 45 segundos para análise
    const response = await timeoutPromise(
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            { text: `TRANSCRICAO:\n${transcription.substring(0, 20000)}` },
            { text: PROMPT }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      }),
      45000,
      "Timeout: Análise demorou demais."
    );

    const text = response.text;
    if (!text) throw new Error("IA não gerou resposta JSON.");

    // Limpeza garantida do JSON
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let json: MeetingAnalysis;
    try {
        json = JSON.parse(cleanJson);
    } catch (e) {
        throw new Error("IA retornou JSON inválido.");
    }

    json.full_transcription = transcription; 
    
    return json;

  } catch (error: any) {
    simplifyError(error);
    return {} as MeetingAnalysis;
  }
};
