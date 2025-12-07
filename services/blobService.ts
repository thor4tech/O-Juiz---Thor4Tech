
import { put } from "@vercel/blob";

// Token fornecido explicitamente para garantir funcionamento
const FALLBACK_TOKEN = 'vercel_blob_rw_OuzJLMYrTsFqdyyd_ymkDBC8Zn4Hr4rZDf3VgixsyISP07h';

const getToken = () => {
  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('THOR_OVERRIDE_BLOB_READ_WRITE_TOKEN') || '';
  }
  
  if (!token) {
    token = process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN || 
            process.env.BLOB_READ_WRITE_TOKEN || 
            FALLBACK_TOKEN;
  }
  return token;
}

export const uploadAnalysisToBlob = async (data: object): Promise<string | null> => {
  const token = getToken();

  if (!token) {
    console.warn("⚠️ [Blob] Token não encontrado. O backup JSON será ignorado.");
    return null;
  }

  try {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `thor4tech-mission-${dateStr}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    console.log(`[Blob] Iniciando upload de JSON ${filename}...`);

    const { url } = await put(filename, jsonString, {
      access: 'public',
      token: token,
      contentType: 'application/json',
      addRandomSuffix: false
    });

    console.log("✅ [Blob] JSON Upload concluído:", url);
    return url;
  } catch (error: any) {
    console.error("❌ [Blob] Erro no upload JSON:", error);
    return null;
  }
};

export const uploadFile = async (file: Blob, filename: string): Promise<string | null> => {
  const token = getToken();

  if (!token) {
    console.warn("⚠️ [Blob] Token não encontrado. O upload do arquivo será ignorado.");
    return null;
  }

  try {
    console.log(`[Blob] Iniciando upload de Arquivo ${filename}...`);

    const { url } = await put(filename, file, {
      access: 'public',
      token: token,
      contentType: file.type, // 'audio/webm' usually
      addRandomSuffix: false
    });

    console.log("✅ [Blob] Arquivo Upload concluído:", url);
    return url;
  } catch (error: any) {
    console.error("❌ [Blob] Erro no upload Arquivo:", error);
    return null;
  }
};
