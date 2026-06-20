import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateTripJSON } from "../utils/jsonValidator.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateTrip(prompt) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const result = await model.generateContent(prompt);

  const response = await result.response;

  const text = response.text();

  const json = JSON.parse(text);

  return validateTripJSON(json);
}
