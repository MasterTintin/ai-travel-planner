export async function getWeather(destination, date) {
  return {
    location: destination,

    date,

    temperature: 24,

    condition: "Sunny",

    recommendation: "เหมาะกับกิจกรรม Outdoor"
  };
}
