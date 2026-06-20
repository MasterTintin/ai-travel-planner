export function calculateTripBudget(trip) {
  let totalActivities = 0;

  const itinerary = trip.itinerary.map((day) => {
    let dayTotal = 0;

    day.activities.forEach((activity) => {
      const cost = parseCost(activity.estimatedCost);

      dayTotal += cost;
    });

    totalActivities += dayTotal;

    return {
      ...day,

      dayTotal
    };
  });

  const flightCost = parseCost(
    trip.recommendedFlight?.estimatedFlightCost || "0"
  );

  return {
    ...trip,

    itinerary,

    budgetSummary: {
      flightCost,

      activityCost: totalActivities,

      grandTotal: flightCost + totalActivities
    }
  };
}

function parseCost(text) {
  if (!text) return 0;

  if (text.includes("ฟรี")) return 0;

  const numbers = text.match(/\d[\d,]*/g);

  if (!numbers) return 0;

  const values = numbers.map((n) => parseInt(n.replace(/,/g, "")));

  if (values.length === 1) return values[0];

  return Math.round((values[0] + values[1]) / 2);
}
