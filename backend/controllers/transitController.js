import dotenv from "dotenv";

dotenv.config();

const ROUTES_API_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

// 🚍 แปลงประเภทยานพาหนะของ Google เป็นภาษาไทย + อิโมจิ
const VEHICLE_LABELS = {
  BUS: { emoji: "🚌", label: "รถเมล์" },
  INTERCITY_BUS: { emoji: "🚌", label: "รถบัสระหว่างเมือง" },
  TROLLEYBUS: { emoji: "🚎", label: "รถรางไฟฟ้า" },
  SUBWAY: { emoji: "🚇", label: "รถไฟใต้ดิน" },
  METRO_RAIL: { emoji: "🚇", label: "รถไฟฟ้า" },
  MONORAIL: { emoji: "🚝", label: "โมโนเรล" },
  HEAVY_RAIL: { emoji: "🚆", label: "รถไฟ" },
  COMMUTER_TRAIN: { emoji: "🚆", label: "รถไฟชานเมือง" },
  HIGH_SPEED_TRAIN: { emoji: "🚄", label: "รถไฟความเร็วสูง" },
  LONG_DISTANCE_TRAIN: { emoji: "🚆", label: "รถไฟทางไกล" },
  RAIL: { emoji: "🚆", label: "รถไฟ" },
  TRAM: { emoji: "🚊", label: "รถราง" },
  FERRY: { emoji: "⛴️", label: "เรือข้ามฟาก" },
  CABLE_CAR: { emoji: "🚠", label: "กระเช้า" },
  GONDOLA_LIFT: { emoji: "🚠", label: "กระเช้าลอยฟ้า" },
  FUNICULAR: { emoji: "🚞", label: "รถรางไต่เขา" },
  OTHER: { emoji: "🚐", label: "ขนส่งสาธารณะ" }
};

const getVehicleInfo = (type) => VEHICLE_LABELS[type] || VEHICLE_LABELS.OTHER;

// ⏱️ แปลงวินาทีจาก Google (เช่น "1754s") เป็นจำนวนนาที
const secondsToMinutes = (durationStr) => {
  if (!durationStr) return 0;
  const seconds = parseInt(String(durationStr).replace("s", ""), 10);
  if (isNaN(seconds)) return 0;
  return Math.round(seconds / 60);
};

// เช็คว่าพิกัดครบและเป็นตัวเลขจริง (รองรับค่า 0 เช่นเส้นแวงที่ลอนดอน)
const hasCoord = (p) =>
  p && typeof p.lat === "number" && typeof p.lng === "number";

// 📞 ฟังก์ชันกลางสำหรับยิง Routes API (เรียกซ้ำได้ทั้งโหมด TRANSIT และ DRIVE)
const callRoutesApi = async (
  apiKey,
  origin,
  destination,
  travelMode,
  departureTime
) => {
  const requestBody = {
    origin: {
      location: { latLng: { latitude: origin.lat, longitude: origin.lng } }
    },
    destination: {
      location: {
        latLng: { latitude: destination.lat, longitude: destination.lng }
      }
    },
    travelMode: travelMode,
    computeAlternativeRoutes: false,
    languageCode: "th",
    units: "METRIC"
  };

  // departureTime ใช้เฉพาะ transit (โหมดขับรถถ้าใส่ต้องมี routingPreference ด้วย เลยไม่ใส่)
  if (travelMode === "TRANSIT" && departureTime) {
    requestBody.departureTime = departureTime;
  }

  // field mask ต่างกันตามโหมด (โหมดขับรถไม่ต้องขอ transitDetails)
  const baseFields = [
    "routes.duration",
    "routes.distanceMeters",
    "routes.polyline.encodedPolyline"
  ];
  const fields =
    travelMode === "TRANSIT"
      ? [
          ...baseFields,
          "routes.legs.steps.travelMode",
          "routes.legs.steps.transitDetails",
          "routes.legs.steps.navigationInstruction"
        ]
      : baseFields;

  const response = await fetch(ROUTES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fields.join(",")
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
};

// 🧹 ย่อย steps ของเส้นทาง transit ให้เหลือเฉพาะข้อมูลที่ frontend ใช้ง่ายๆ
const parseTransitSteps = (route) => {
  const steps = [];
  (route.legs || []).forEach((leg) => {
    (leg.steps || []).forEach((step) => {
      if (step.travelMode === "TRANSIT" && step.transitDetails) {
        const td = step.transitDetails;
        const line = td.transitLine || {};
        const vehicleType = line.vehicle?.type || "OTHER";
        const v = getVehicleInfo(vehicleType);

        steps.push({
          type: "transit",
          emoji: v.emoji,
          vehicle: v.label,
          lineName: line.nameShort || line.name || "",
          color: line.color || "#1677ff",
          departureStop: td.stopDetails?.departureStop?.name || "",
          arrivalStop: td.stopDetails?.arrivalStop?.name || "",
          departureTime: td.localizedValues?.departureTime?.time?.text || "",
          arrivalTime: td.localizedValues?.arrivalTime?.time?.text || "",
          numStops: td.stopCount || 0,
          headsign: td.headsign || ""
        });
      } else if (step.travelMode === "WALK") {
        steps.push({
          type: "walk",
          emoji: "🚶",
          vehicle: "เดิน",
          instruction: step.navigationInstruction?.instructions || "เดิน"
        });
      }
    });
  });
  return steps;
};

// 🚆 หาเส้นทางจากจุด A → จุด B: ลอง transit ก่อน, ไม่มีก็ fallback เป็นขับรถ, แนบลิงก์ Google Maps เสมอ
export const getTransitDirections = async (req, res) => {
  try {
    const { origin, destination, departureTime } = req.body;

    // 1) เช็คพิกัดครบไหม
    if (!hasCoord(origin) || !hasCoord(destination)) {
      return res.status(400).json({
        error:
          "ต้องส่งพิกัด origin และ destination (lat, lng เป็นตัวเลข) มาให้ครบ"
      });
    }

    // 2) เช็ค API key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "ยังไม่ได้ตั้งค่า GOOGLE_MAPS_API_KEY ใน .env"
      });
    }

    // 🔗 ลิงก์ Google Maps สำรอง (เปิดในเบราว์เซอร์/แอป ซึ่งมีข้อมูลขนส่งสาธารณะครบกว่า API เช่นญี่ปุ่น)
    const googleMapsUrl =
      "https://www.google.com/maps/dir/?api=1" +
      `&origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}` +
      "&travelmode=transit";

    // 3) ลอง TRANSIT ก่อน
    const transitResult = await callRoutesApi(
      apiKey,
      origin,
      destination,
      "TRANSIT",
      departureTime
    );

    // ถ้า Google ตอบ error จริง (key ผิด / ยังไม่เปิด billing / ยังไม่ enable API)
    if (!transitResult.ok) {
      console.error(
        "Routes API error:",
        JSON.stringify(transitResult.data, null, 2)
      );
      return res.status(transitResult.status).json({
        error: transitResult.data.error?.message || "เรียก Routes API ไม่สำเร็จ"
      });
    }

    const transitRoute = transitResult.data.routes?.[0];

    // ✅ เจอเส้นทาง transit → ส่งกลับเลย
    if (transitRoute) {
      return res.status(200).json({
        mode: "transit",
        totalDurationMinutes: secondsToMinutes(transitRoute.duration),
        distanceMeters: transitRoute.distanceMeters || 0,
        encodedPolyline: transitRoute.polyline?.encodedPolyline || "",
        steps: parseTransitSteps(transitRoute),
        note: "",
        googleMapsUrl
      });
    }

    // 4) ไม่มี transit → fallback ลองขับรถ (DRIVE)
    const driveResult = await callRoutesApi(
      apiKey,
      origin,
      destination,
      "DRIVE",
      null
    );
    const driveRoute = driveResult.ok ? driveResult.data.routes?.[0] : null;

    // 🚗 เจอเส้นทางขับรถ → ส่งกลับพร้อมหมายเหตุ
    if (driveRoute) {
      return res.status(200).json({
        mode: "driving",
        totalDurationMinutes: secondsToMinutes(driveRoute.duration),
        distanceMeters: driveRoute.distanceMeters || 0,
        encodedPolyline: driveRoute.polyline?.encodedPolyline || "",
        steps: [],
        note: "ไม่มีข้อมูลขนส่งสาธารณะสำหรับเส้นทางนี้ จึงแสดงเส้นทางขับรถแทน",
        googleMapsUrl
      });
    }

    // 5) ไม่มีทั้ง transit และขับรถ → ส่งแค่ลิงก์สำรอง
    return res.status(200).json({
      mode: "none",
      totalDurationMinutes: 0,
      distanceMeters: 0,
      encodedPolyline: "",
      steps: [],
      note: "ไม่พบข้อมูลเส้นทางสำหรับ 2 จุดนี้ ลองดูใน Google Maps โดยตรง",
      googleMapsUrl
    });
  } catch (error) {
    console.error("Transit Directions Error:", error);
    return res.status(500).json({
      error: error.message
    });
  }
};
