export function buildPDFData(trip) {
  return {
    title: trip.tripName,

    destination: trip.destination,

    totalDays: trip.totalDays,

    itinerary: trip.itinerary
  };
}
