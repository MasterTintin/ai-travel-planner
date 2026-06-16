import fs from "fs";

const FILE_PATH = "./trips.json";

export const updateTrip = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updateData = req.body;

    let trips = [];

    if (fs.existsSync(FILE_PATH)) {
      trips = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    const index = trips.findIndex((trip) => trip.id === id);

    if (index === -1) {
      return res.status(404).json({
        error: "Trip not found"
      });
    }

    trips[index] = {
      ...trips[index],
      ...updateData
    };

    fs.writeFileSync(FILE_PATH, JSON.stringify(trips, null, 2));

    res.json(trips[index]);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Update Trip Failed"
    });
  }
};
