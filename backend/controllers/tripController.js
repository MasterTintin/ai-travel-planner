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
You are an expert Travel ROUTE PLANNER, not a list generator.
Your job is NOT to list famous attractions — your job is to design an optimized,
walkable/efficient daily route that matches the user's specific interests.

Create a highly personalized travel itinerary.

Requirements:
- Destination: ${destination}
- Duration: ${days} days
- Budget: ${budget}
- Interests: ${safeInterests}
- Departure Date: ${departureDate}
- Flight Preference: ${airlinePreference}

IMPORTANT:

User interests are the highest priority when selecting activities.

If a conflict exists between famous attractions and user interests, prioritize user interests.

Rules:

1. Generate realistic travel plan.
2. Write descriptions in Thai.
3. Include realistic costs.
4. Return ONLY raw JSON.
5. Do NOT use markdown.
6. Include budgetSummary.

7. Activities in the same day MUST be ordered based on geographic proximity —
   think like a route planner: minimize total backtracking and travel time,
   not like a list of popular attractions sorted by fame.
   Before finalizing each day, mentally check: "Does this order avoid
   zig-zagging across the city?" If not, reorder it.

8. Every activity MUST include latitude and longitude.
   These coordinates MUST be the REAL, PRECISE location of that specific
   place (not the city center, not an approximation) — they will be plotted
   on an actual map (Leaflet/OpenStreetMap) and used to draw the route line,
   so accuracy matters.

9. Every activity MUST include transportType.
10. Every activity MUST include travelMinutes.
11. Every activity MUST include priorityScore (1-10).
12. Every activity MUST include rainyAlternative.
13. Every activity MUST include highlight array.
14. Each day MUST include estimatedDayCost.
15. Each day MUST include estimatedTravelMinutes.
16. Each day MUST include walkingDistanceKm.
17. startTime and endTime are required.
18. Activities must be chronologically ordered.
19. Use real attractions only.
20. Activities MUST strongly reflect user's interests.
21. Avoid generic tourist itineraries.
22. At least 70% of activities MUST be selected based on user interests.
23. Do NOT simply include the most famous attractions.
24. Create unique experiences matching user interests.

25. Every activity description MUST contain at least 80-120 Thai words,
    written as ONE natural, flowing Thai paragraph (not bullet points),
    and MUST explain all of the following within that paragraph:
    - ทำไมเลือกสถานที่นี้ (why this location was selected)
    - สถานที่นี้ตรงกับความสนใจของผู้ใช้อย่างไร (how it matches user's interests)
    - ประสบการณ์เฉพาะตัวที่ผู้ใช้จะได้รับ (unique experience the user will get)
    - เกร็ดลับท้องถิ่น 1 อย่าง (one local insider tip)
    Do not pad the word count with generic filler — every sentence must add
    real information.

26. Avoid large empty time gaps.
27. Include breakfast, lunch, dinner and evening activities.
28. Each day MUST have a unique daily theme based on the destination and user interests.
29. Meals should include real restaurants, cafes, food markets, or local food recommendations whenever possible.
30. Prioritize hidden gems and authentic local experiences over famous tourist attractions whenever appropriate.
31. Adapt the itinerary based on destination-specific culture, transportation systems, food, climate, and local customs.
32. Do NOT repeat the same type of attraction multiple times in the same trip unless strongly justified.
33. Each day should provide a different experience from previous days.
34. Balance attractions, food, culture, shopping, nature, and local experiences based on user interests.

35. After planning all days, evaluate the ENTIRE trip's route efficiency as a
    whole (across all days combined) and include ONE routeOptimization object
    at the trip level (NOT per day):
    - "score": an integer 1-10, where 10 means activities are tightly
      clustered with minimal backtracking and very efficient transitions
      between locations across the whole trip, and 1 means the route
      zig-zags inefficiently across the city/region.
    - "reason": a short Thai sentence explaining WHY you gave that score
      (e.g. mention clustering, distance between zones, or any inefficiency
      you accepted as a tradeoff for user interests).
    Be honest — if the route isn't perfectly efficient because user interests
    required spreading activities out, say so in the reason instead of
    inflating the score.

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

  "routeOptimization": {
    "score": 8,
    "reason": "เหตุผลภาษาไทยสั้นๆ ว่าทำไมให้คะแนนนี้"
  },

  "itinerary": [
{
  "day": 1,

  "theme": "Daily Theme",

  "estimatedDayCost": 3500,

  "estimatedTravelMinutes": 90,

  "walkingDistanceKm": 5.4,

  "activities": [
    {
      "startTime": "09:00",
      "endTime": "11:00",
      "durationMinutes": 120,

      "locationName": "Sensoji Temple",

      "description": "รายละเอียดภาษาไทย (80-120 คำ ครบ 4 องค์ประกอบตามข้อ 25)",

      "latitude": 35.7148,
      "longitude": 139.7967,

      "estimatedCost": 1200,

      "displayCost": "1,200 JPY",

      "transportType": "Tokyo Metro Ginza Line",

      "travelMinutes": 15,

      "priorityScore": 9,

      "rainyAlternative": "Tokyo National Museum",

      "highlight": [
        "Temple",
        "Photo Spot",
        "Local Food"
      ]
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
    console.log("===== GEMINI RAW RESPONSE =====");
    console.log(responseText);
    console.log("===============================");
    const firstBrace = responseText.indexOf("{");
    const lastBrace = responseText.lastIndexOf("}");

    const cleanJson = responseText.slice(firstBrace, lastBrace + 1);

    const tripData = JSON.parse(cleanJson);

    return res.status(200).json(tripData);
  } catch (error) {
    console.error("Gemini Controller Error:", error);

    return res.status(500).json({
      error: "เกิดข้อผิดพลาดในการประมวลผล",
      details: error.message
    });
  }
};

export const rePlanTrip = async (req, res) => {
  try {
    const { trip } = req.body;

    if (!trip) {
      return res.status(400).json({
        error: "Missing trip"
      });
    }

    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `
You are a travel planner AI.

The user already has an itinerary.

Your job is to improve it.

Rules:

1. Optimize route efficiency.
2. Reduce unnecessary travel.
3. Improve activity order.
4. Keep descriptions in Thai.
5. Return ONLY JSON.
6. Preserve the same schema.

Current itinerary:

${JSON.stringify(itinerary)}
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

    const optimizedTrip = JSON.parse(responseText);

    return res.status(200).json(optimizedTrip);
  } catch (error) {
    console.error("RePlan Error:", error);

    return res.status(500).json({
      error: "Failed to replan trip",
      details: error.message
    });
  }
};
