import fs from "fs";

const FILE_PATH = "./trips.json";

export const saveTrip = async (req, res) => {
  try {
    // ✅ ดึง userId จาก token ที่ authMiddleware ถอดไว้ให้
    //    (รองรับทั้ง id / _id / userId แล้วแต่ตอน login เซ็น payload มาแบบไหน)
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized: user id not found in token"
      });
    }

    const tripData = req.body;

    let trips = [];
    if (fs.existsSync(FILE_PATH)) {
      const fileData = fs.readFileSync(FILE_PATH, "utf8");
      if (fileData) {
        trips = JSON.parse(fileData);
      }
    }

    // ✅ เช็คทริปซ้ำ "เฉพาะของ user คนนี้" เท่านั้น
    //    คนละ user ตั้งชื่อทริปเหมือนกันได้ ไม่ถือว่าซ้ำ
    const exists = trips.find(
      (trip) =>
        trip.userId === userId &&
        trip.tripName === tripData.tripName &&
        trip.destination === tripData.destination
    );

    if (exists) {
      return res.status(400).json({
        error: "Trip already saved"
      });
    }

    // ✅ สำคัญ: spread tripData ก่อน แล้วค่อยเขียนทับ id / userId / createdAt
    //    เพื่อกัน client แอบส่ง userId หรือ id ปลอมมาทับของจริง
    const newTrip = {
      ...tripData,
      id: Date.now(),
      userId, // ผูกทริปกับเจ้าของ
      createdAt: new Date().toISOString()
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
