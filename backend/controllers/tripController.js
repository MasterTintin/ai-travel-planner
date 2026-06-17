import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

console.log("✅ Gemini API Loaded");

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateTrip = async (req, res) => {
  try {
    const {
      budget,
      destination,
      days,
      interests,
      departureDate,
      airlinePreference
    } = req.body;

    // Validation
    if (
      !budget ||
      !destination ||
      !days ||
      !departureDate ||
      !airlinePreference
    ) {
      return res.status(400).json({
        error: "กรุณากรอกข้อมูลให้ครบ"
      });
    }

    const safeInterests = interests?.trim() || "General Travel";

    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `
Create a highly personalized travel itinerary.

Requirements:
- Destination: ${destination}
- Duration: ${days} days
- Budget: ${budget}
- Interests: ${safeInterests}
- Departure Date: ${departureDate}
- Flight Preference: ${airlinePreference}

Rules:

1. Generate realistic travel plan.
2. Write descriptions in Thai.
3. Include realistic costs.
4. Return ONLY raw JSON.
5. Do NOT use markdown.
6. estimatedFlightCost MUST be NUMBER.
7. estimatedCost MUST be NUMBER.
8. displayCost MUST be string.
9. Include budgetSummary.

JSON Schema:

{
  "tripName": "Trip Title",
  "destination": "${destination}",
  "totalDays": ${days},
  "budgetLevel": "${budget}",

  "recommendedFlight": {
    "flightType": "Full Service",
    "suggestedAirlines": "ANA / JAL",
    "estimatedFlightCost": 18500,
    "displayFlightCost": "18,500 THB",
    "flightTips": "Book early."
  },

  "budgetSummary": {
    "flightCost": 18500,
    "activityCost": 9500,
    "transportCost": 2500,
    "hotelCost": 12000,
    "grandTotal": 42500
  },

  "itinerary": [
    {
      "day": 1,
      "theme": "Daily Theme",
      "activities": [
        {
          "time": "09:00",
          "locationName": "Location",
          "description": "รายละเอียดภาษาไทย",
          "latitude": 35.0,
          "longitude": 139.0,
          "estimatedCost": 1200,
          "displayCost": "500 - 2,000 THB"
        }
      ]
    }
  ]
}
`;

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

    return res.status(200).json(tripData);
  } catch (error) {
    console.error("Gemini Controller Error:", error);

    return res.status(500).json({
      error: "เกิดข้อผิดพลาดในการประมวลผล",
      details: error.message
    });
  }
};
