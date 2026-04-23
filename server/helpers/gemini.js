const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateContent(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
}

function parseGeminiJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (error) {
    throw {
      name: "BadRequest",
      message: "AI returned an invalid format. Please try again.",
    };
  }
}

module.exports = { generateContent, parseGeminiJSON };
