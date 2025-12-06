
import { put } from "@vercel/blob";

export const uploadAnalysisToBlob = async (data: object): Promise<string | null> => {
  // Leitura robusta do token
  const token = process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.warn("BLOB_READ_WRITE_TOKEN não encontrado. O upload do JSON será pulado.");
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
