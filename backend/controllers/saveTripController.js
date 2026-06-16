import fs from "fs";

const FILE_PATH = "./trips.json";

export const saveTrip = async (req, res) => {
  try {
    const tripData = req.body;

    let trips = [];

    if (fs.existsSync(FILE_PATH)) {
      const fileData = fs.readFileSync(FILE_PATH, "utf8");

      if (fileData) {
        trips = JSON.parse(fileData);
      }
    }

    const exists = trips.find(
      (trip) =>
        trip.tripName === tripData.tripName &&
        trip.destination === tripData.destination
    );

    if (exists) {
      return res.status(400).json({
        error: "Trip already saved"
      });
    }

    const newTrip = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...tripData
    };

    trips.push(newTrip);

    fs.writeFileSync(FILE_PATH, JSON.stringify(trips, null, 2));

    return res.status(200).json(newTrip);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Save Trip Failed"
    });
  }
};
