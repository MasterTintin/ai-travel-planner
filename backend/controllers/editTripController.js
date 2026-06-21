import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const editTrip = async (req, res) => {
  try {
    const { trip, instruction } = req.body;

    if (!trip) {
      return res.status(400).json({
        error: "Missing trip"
      });
    }

    if (!instruction) {
      return res.status(400).json({
        error: "Missing instruction"
      });
    }

    console.log("========== AI EDIT ==========");
    console.log("Instruction:", instruction);
    console.log("=============================");

    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.8
      }
    });

    const prompt = `
You are a professional travel planner.

Your task is to MODIFY an existing itinerary.

IMPORTANT RULES:

- Keep the existing JSON structure.
- Only modify what the user requested.
- Do NOT rebuild the entire trip.
- Do NOT remove unrelated activities.
- Preserve all existing fields.
- Keep descriptions in Thai.
- Keep costs realistic.
- Return ONLY valid JSON.
- No markdown.
- No explanations.

User Request:

${instruction}

Current Trip:

${JSON.stringify(trip, null, 2)}
`;

    const result = await model.generateContent(prompt);

    let text = result.response.text().trim();

    if (text.startsWith("```")) {
      text = text
        .replace(/^```json/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();
    }

    const updatedTrip = JSON.parse(text);

    return res.status(200).json(updatedTrip);
  } catch (error) {
    console.error("AI EDIT ERROR:");
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
};
