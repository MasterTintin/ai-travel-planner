export function validatePlaces(trip) {
  if (!trip.itinerary) return trip;

  trip.itinerary.forEach((day) => {
    day.activities.forEach((activity) => {
      if (!activity.locationName) {
        activity.valid = false;
        activity.error = "Missing Location";

        return;
      }

      if (!activity.latitude || !activity.longitude) {
        activity.valid = false;

        activity.error = "Missing Coordinate";

        return;
      }

      activity.valid = true;
    });
  });

  return trip;
}
