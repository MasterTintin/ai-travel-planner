import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const replanTrip = async (req, res) => {
  try {
    const { trip } = req.body;

    if (!trip) {
      return res.status(400).json({
        error: "Missing trip"
      });
    }

    console.log("========== REPLAN ==========");
    console.log("Destination:", trip.destination);
    console.log("Days:", trip.totalDays);
    console.log("============================");

    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 1.2
      }
    });

    const prompt = `
You are a world-class travel planner.

Create a COMPLETELY NEW travel itinerary.

Keep:
- destination
- totalDays
- budgetLevel

Requirements:
- Create a different route.
- Create different attractions.
- Create different restaurants.
- Create different daily themes.
- Reuse less than 30% of original activities.
- Prioritize hidden gems.
- Match user interests.
- Use realistic transportation.
- Use realistic costs.
- Write descriptions in Thai.
- Return ONLY valid JSON.

The returned JSON MUST follow this structure:

{
  "tripName": "",
  "destination": "",
  "totalDays": 0,
  "budgetLevel": "",

  "recommendedFlight": {
    "flightType": "",
    "suggestedAirlines": "",
    "estimatedFlightCost": 0,
    "displayFlightCost": "",
    "flightTips": ""
  },

  "budgetSummary": {
    "flightCost": 0,
    "activityCost": 0,
    "transportCost": 0,
    "hotelCost": 0,
    "grandTotal": 0
  },

  "itinerary": []
}

Original Trip:

${JSON.stringify(trip)}
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

    console.log("===== GEMINI RESPONSE =====");
    console.log(text.substring(0, 1000));
    console.log("===========================");

    const newTrip = JSON.parse(text);

    return res.status(200).json(newTrip);
  } catch (error) {
    console.error("REPLAN ERROR:");
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
};
