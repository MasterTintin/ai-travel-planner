import fs from "fs";

const FILE_PATH = "./trips.json";

export const deleteTrip = async (req, res) => {
  try {
    const id = Number(req.params.id);

    let trips = [];

    if (fs.existsSync(FILE_PATH)) {
      trips = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    const newTrips = trips.filter((trip) => trip.id !== id);

    fs.writeFileSync(FILE_PATH, JSON.stringify(newTrips, null, 2));

    res.json({
      success: true,
      message: "Delete Success"
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Delete Trip Failed"
    });
  }
};
