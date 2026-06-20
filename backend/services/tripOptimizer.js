import { calculateTravelInfo } from "./mapService.js";

export function optimizeTrip(trip) {
  if (!trip?.itinerary) {
    return trip;
  }

  trip.itinerary.forEach((day) => {
    if (!day.activities?.length) {
      return;
    }

    // 1. ลบสถานที่ซ้ำ

    const uniqueActivities = [];

    const seen = new Set();

    day.activities.forEach((activity) => {
      const key = activity.name?.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        uniqueActivities.push(activity);
      }
    });

    // 2. Sort ตามเวลา

    uniqueActivities.sort((a, b) => {
      return convertTime(a.time) - convertTime(b.time);
    });

    // 3. สร้าง Route Metadata

    for (let i = 0; i < uniqueActivities.length; i++) {
      uniqueActivities[i].order = i + 1;

      if (i < uniqueActivities.length - 1) {
        const current = uniqueActivities[i];

        const next = uniqueActivities[i + 1];

        const route = calculateTravelInfo(current, next);

        current.routeToNext = route;
      }
    }

    // 4. รวมเวลาท่องเที่ยว

    let totalMinutes = 0;

    uniqueActivities.forEach((activity) => {
      totalMinutes += activity.estimatedDuration || 60;

      if (activity.routeToNext?.travelMinutes) {
        totalMinutes += activity.routeToNext.travelMinutes;
      }
    });

    day.totalEstimatedMinutes = totalMinutes;

    day.activities = uniqueActivities;
  });

  return trip;
}

function convertTime(time) {
  if (!time) {
    return 9999;
  }

  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
}
