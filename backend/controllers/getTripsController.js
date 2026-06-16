import fs from "fs";

const FILE_PATH = "./trips.json";

export const getTrips = async (req, res) => {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      return res.json([]);
    }

    const fileData = fs.readFileSync(FILE_PATH, "utf8");

    if (!fileData) {
      return res.json([]);
    }

    const trips = JSON.parse(fileData);

    res.json(trips);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Get Trips Failed"
    });
  }
};
