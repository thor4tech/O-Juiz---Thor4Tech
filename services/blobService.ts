import { put } from "@vercel/blob";

export const uploadAnalysisToBlob = async (data: object, token: string): Promise<string | null> => {
  try {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `meeting-analysis-${dateStr}.txt`;
    const jsonString = JSON.stringify(data, null, 2);

    // Using client-side upload with the token
    const { url } = await put(filename, jsonString, {
      access: 'public',
      token: token, 
      contentType: 'text/plain' // Saving as txt/json
    });

    console.log("Blob Upload Success:", url);
    return url;
  } catch (error) {
    console.error("Vercel Blob Upload Failed:", error);
    // Non-blocking error - we return null so the app continues
    return null;
  }
};