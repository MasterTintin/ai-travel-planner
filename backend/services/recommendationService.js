export function enrichActivities(trip) {
  if (!trip?.itinerary) return trip;

  trip.itinerary.forEach((day) => {
    if (!day.activities) return;

    day.activities.forEach((activity) => {
      //--------------------------------
      // Travel Tip
      //--------------------------------

      if (!activity.travelTip) {
        activity.travelTip = "ควรมาถึงก่อนเวลาอย่างน้อย 20 นาที";
      }

      //--------------------------------
      // Highlight
      //--------------------------------

      if (!activity.highlight) {
        activity.highlight = [];
      }

      if (activity.highlight.length === 0) {
        activity.highlight = generateHighlights(activity);
      }

      //--------------------------------
      // Priority Score
      //--------------------------------

      if (!activity.priorityScore) {
        activity.priorityScore = 7;
      }

      //--------------------------------
      // Rainy Alternative
      //--------------------------------

      if (!activity.rainyAlternative) {
        activity.rainyAlternative = "คาเฟ่หรือพิพิธภัณฑ์ใกล้เคียง";
      }

      //--------------------------------
      // Transport
      //--------------------------------

      if (!activity.transportType) {
        activity.transportType = "Walking";
      }

      //--------------------------------
      // Travel Minutes
      //--------------------------------

      if (!activity.travelMinutes) {
        activity.travelMinutes = 10;
      }

      //--------------------------------
      // Duration
      //--------------------------------

      if (!activity.durationMinutes) {
        activity.durationMinutes = 60;
      }

      //--------------------------------
      // Cost
      //--------------------------------

      if (!activity.displayCost) {
        activity.displayCost = `${activity.estimatedCost || 0} JPY`;
      }
    });

    //--------------------------------
    // Day Summary
    //--------------------------------

    day.estimatedDayCost = day.activities.reduce(
      (sum, activity) => sum + (activity.estimatedCost || 0),
      0
    );

    day.estimatedTravelMinutes = day.activities.reduce(
      (sum, activity) => sum + (activity.travelMinutes || 0),
      0
    );

    day.totalActivities = day.activities.length;
  });

  return trip;
}

function generateHighlights(activity) {
  const text =
    `${activity.locationName || ""} ${activity.description || ""}`.toLowerCase();

  const result = [];

  if (text.includes("temple") || text.includes("วัด")) {
    result.push("Temple");
  }

  if (text.includes("museum") || text.includes("พิพิธภัณฑ์")) {
    result.push("Museum");
  }

  if (text.includes("food") || text.includes("อาหาร")) {
    result.push("Local Food");
  }

  if (text.includes("shopping") || text.includes("ตลาด")) {
    result.push("Shopping");
  }

  result.push("Photo Spot");

  return [...new Set(result)];
}
