import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

console.log("===============");
console.log("Gemini Key:");
console.log(process.env.GEMINI_API_KEY);
console.log("===============");
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateTrip = async (req, res) => {
  try {
    // 1. รับค่าตัวแปรฟิลด์ใหม่ มาจากหน้าบ้านเพิ่ม
    const {
      budget,
      destination,
      days,
      interests,
      departureDate,
      airlinePreference
    } = req.body;

    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // 2. ปรับ Prompt เพื่อบังคับให้คิดข้อมูลตั๋วเครื่องบินและงบประมาณ
    const prompt = `Create a highly personalized day-by-day travel itinerary and flight recommendation for a trip to ${destination}.
    Strict Constraints:
    - Duration: ${days} days
    - Ground Budget Level: ${budget}
    - Traveler Interests: ${interests}
    - Departure Date from Bangkok (BKK/DMK): ${departureDate}
    - Flight Tier Preference: ${airlinePreference}

    For the "recommendedFlight" object:
    - Base on the flight tier "${airlinePreference}" for departure date ${departureDate}.
    - "flightType" should reflect the tier.
    - "suggestedAirlines" should list 2-3 realistic airlines matching that tier.
    - "estimatedFlightCost" should be a realistic round-trip estimate in THB.
    - "flightTips" should give a useful dynamic tip based on traveling around ${departureDate}.

    Return ONLY a raw JSON object matching the schema below. Do NOT wrap in markdown.
    {
      "tripName": "A creative title for this specific trip",
      "destination": "${destination}",
      "totalDays": ${days},
      "budgetLevel": "${budget}",
      "recommendedFlight":{
        "flightType":"Full Service",
        "suggestedAirlines":"ANA / JAL",
        "estimatedFlightCost":18500,
        "displayFlightCost":"18,500 THB",
        "flightTips":"..."
    },

    "budgetSummary":{
        "flightCost":18500,
        "activityCost":9500,
        "transportCost":2500,
        "hotelCost":12000,
        "grandTotal":42500
    },
    
      "itinerary": [
        {
          "day": 1,
          "theme": "Core theme or focus of this day",
          "activities": [
            {
              "time": "HH:MM",
              "locationName": "Precise name of the place",
              "description": "Engaging description of what to do there (Write in Thai language)",
              "latitude": 0.0,
              "longitude": 0.0,
              "estimatedCost": 1200,
              "displayCost": "500 - 2,000 THB"
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
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการประมวลผล",
      details: error.message
    });
  }
};
