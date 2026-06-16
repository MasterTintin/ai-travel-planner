import fs from "fs";

const FILE_PATH = "./trips.json";

// 🗑 ลบทริป — ลบได้เฉพาะทริปของตัวเองเท่านั้น
export const deleteTrip = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    const tripId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized: user id not found in token"
      });
    }

    let trips = [];
    if (fs.existsSync(FILE_PATH)) {
      const fileData = fs.readFileSync(FILE_PATH, "utf8");
      if (fileData) {
        trips = JSON.parse(fileData);
      }
    }

    const targetTrip = trips.find((trip) => String(trip.id) === String(tripId));

    if (!targetTrip) {
      return res.status(404).json({
        error: "Trip not found"
      });
    }

    if (String(targetTrip.userId) !== String(userId)) {
      return res.status(403).json({
        error: "Forbidden: this trip is not yours"
      });
    }

    const updatedTrips = trips.filter(
      (trip) => String(trip.id) !== String(tripId)
    );

    fs.writeFileSync(FILE_PATH, JSON.stringify(updatedTrips, null, 2));

    return res.status(200).json({
      success: true,
      message: "Trip deleted"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Delete Trip Failed"
    });
  }
};
