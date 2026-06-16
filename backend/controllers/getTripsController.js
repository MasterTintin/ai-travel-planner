import fs from "fs";

const FILE_PATH = "./trips.json";

export const getTrips = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized: user id not found in token"
      });
    }

    if (!fs.existsSync(FILE_PATH)) {
      return res.json([]);
    }

    const fileData = fs.readFileSync(FILE_PATH, "utf8");
    if (!fileData) {
      return res.json([]);
    }

    const trips = JSON.parse(fileData);
    const userTrips = trips.filter((trip) => trip.userId === userId);

    return res.json(userTrips);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Get Trips Failed"
    });
  }
};
