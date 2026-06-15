export const saveTrip = async (req, res) => {
  try {
    const tripData = req.body;

    console.log("========== SAVE TRIP ==========");
    console.log(tripData);
    console.log("===============================");

    res.status(200).json({
      success: true,
      message: "Save Trip Success",
      trip: tripData
    });
  } catch (error) {
    res.status(500).json({
      error: "Save Trip Failed"
    });
  }
};
