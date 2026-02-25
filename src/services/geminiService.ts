import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const analyzeImage = async (base64Image: string, mimeType: string) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Image.split(",")[1],
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this image. 
            Identify if it is a food item, an electronic product, a personal care product (like shampoo), or a general object.
            
            Provide the following in JSON format:
            - type: 'food', 'electronic', 'personal_care', or 'object'
            - name: The name of the item.
            - description: A short, engaging description.
            - howToUse: A step-by-step guide or recommendation on how to use/consume it.
            - advantages: List 3-5 advantages or benefits.
            - disadvantages: List 2-3 disadvantages, side effects, or limitations.
            - rating: An honest rating out of 5 (e.g., 4.5).
            
            If it is FOOD, also include:
            - calories, protein, carbs, fat (per typical serving).
            
            Return the result strictly in JSON format matching the provided schema.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Type of item" },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          howToUse: { type: Type.STRING },
          advantages: { type: Type.ARRAY, items: { type: Type.STRING } },
          disadvantages: { type: Type.ARRAY, items: { type: Type.STRING } },
          rating: { type: Type.NUMBER, description: "Rating out of 5" },
          calories: { type: Type.STRING },
          protein: { type: Type.STRING },
          carbs: { type: Type.STRING },
          fat: { type: Type.STRING },
        },
        required: ["type", "name", "description", "howToUse", "advantages", "disadvantages", "rating"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    throw new Error("Failed to process the analysis results.");
  }
};
