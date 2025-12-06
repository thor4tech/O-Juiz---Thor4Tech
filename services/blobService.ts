
import { put } from "@vercel/blob";

export const uploadAnalysisToBlob = async (data: object): Promise<string | null> => {
  // 1. Try LocalStorage Override
  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('THOR_OVERRIDE_BLOB_READ_WRITE_TOKEN') || '';
  }

  // 2. Try Env Vars & Hardcoded Fallback
  if (!token) {
    token = process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN || 
            process.env.BLOB_READ_WRITE_TOKEN ||
            process.env.REACT_APP_BLOB_READ_WRITE_TOKEN || 
            'vercel_blob_rw_OuzJLMYrTsFqdyyd_ymkDBC8Zn4Hr4rZDf3VgixsyISP07h';
  }

  if (!token) {
    console.warn("⚠️ Vercel Blob Token não encontrado. O upload do JSON será pulado.");
    return null;
  }

  try {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `thor4tech-analysis-${dateStr}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    const { url } = await put(filename, jsonString, {
      access: 'public',
      token: token,
      contentType: 'application/json'
    });

    console.log("✅ Backup salvo no Vercel Blob:", url);
    return url;
  } catch (error) {
    console.error("❌ Erro ao salvar no Blob:", error);
    return null;
  }
};
