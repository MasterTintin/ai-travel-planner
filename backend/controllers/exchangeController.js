import axios from "axios";

export const getExchangeRates = async (req, res) => {
  try {
    const response = await axios.get("https://open.er-api.com/v6/latest/THB");

    const rates = response.data.rates;

    const exchangeData = Object.entries(rates).map(([code, rate]) => ({
      code,
      rate: 1 / rate,
      name: code
    }));

    return res.json({
      success: true,
      base: "THB",
      lastUpdate: response.data.time_last_update_utc,
      rates: exchangeData
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      error: "Cannot fetch exchange rates"
    });
  }
};
