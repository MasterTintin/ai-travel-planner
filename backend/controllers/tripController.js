import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateTrip = async (req, res) => {
  try {
    const { budget, destination, days, interests } = req.body;

    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Create a highly personalized day-by-day travel itinerary for a trip to ${destination}.
    Strict Constraints:
    - Duration: ${days} days
    - Budget Level: ${budget}
    - Traveler Interests: ${interests}

    Return ONLY a raw JSON object matching the schema below. Do NOT wrap in markdown.
    {
      "tripName": "A creative title for this specific trip",
      "destination": "${destination}",
      "totalDays": ${days},
      "budgetLevel": "${budget}",
      "itinerary": [
        {
          "day": 1,
          "theme": "Core theme or focus of this day",
          "activities": [
            {
              "time": "HH:MM",
              "locationName": "Precise name of the place",
              "description": "Engaging description of what to do there",
              "latitude": 0.0,
              "longitude": 0.0,
              "estimatedCost": 0
            }
          ]
        }
      ]
    }`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    if (responseText.startsWith("```")) {
      responseText = responseText
        .replace(/^```json/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();
    }

    const tripData = JSON.parse(responseText);
    res.json(tripData);
  } catch (error) {
    console.error("Gemini Controller Error:", error);
    res
      .status(500)
      .json({
        error: "เกิดข้อผิดพลาดในการประมวลผลแผนการเดินทาง",
        details: error.message
      });
  }
};
