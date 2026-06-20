import axios from "axios";

const API_KEY = process.env.EXCHANGE_API_KEY;

export async function getExchangeRates(base = "THB") {
  try {
    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${base}`;

    const response = await axios.get(url);

    return response.data;
  } catch (err) {
    throw new Error("Exchange API Failed");
  }
}
