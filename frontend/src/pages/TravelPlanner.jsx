import React, { useState, useEffect, useRef } from "react";
import api from "../services/api.js";
import BudgetSummary from "../components/BudgetSummary.jsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Navbar from "../components/Navbar.jsx";
import planeBg from "../assets/plane.jpg";
import cloudsBg from "../assets/cloud.jpg";

// 🌍 รายชื่อประเทศทั่วโลกที่เป็นมาตรฐานสากล พร้อมตัวแมปสกุลเงินสำหรับเครื่องคำนวณเงิน
const ALL_COUNTRIES = [
  { name: "Afghanistan", currency: "AFN" },
  { name: "Albania", currency: "ALL" },
  { name: "Algeria", currency: "DZD" },
  { name: "Andorra", currency: "EUR" },
  { name: "Angola", currency: "AOA" },
  { name: "Antigua and Barbuda", currency: "XCD" },
  { name: "Argentina", currency: "ARS" },
  { name: "Armenia", currency: "AMD" },
  { name: "Australia", currency: "AUD" },
  { name: "Austria", currency: "EUR" },
  { name: "Azerbaijan", currency: "AZN" },
  { name: "Bahamas", currency: "BSD" },
  { name: "Bahrain", currency: "BHD" },
  { name: "Bangladesh", currency: "BDT" },
  { name: "Barbados", currency: "BBD" },
  { name: "Belarus", currency: "BYN" },
  { name: "Belgium", currency: "EUR" },
  { name: "Belize", currency: "BZD" },
  { name: "Benin", currency: "XOF" },
  { name: "Bhutan", currency: "BTN" },
  { name: "Bolivia", currency: "BOB" },
  { name: "Bosnia and Herzegovina", currency: "BAM" },
  { name: "Botswana", currency: "BWP" },
  { name: "Brazil", currency: "BRL" },
  { name: "Brunei", currency: "BND" },
  { name: "Bulgaria", currency: "BGN" },
  { name: "Burkina Faso", currency: "XOF" },
  { name: "Burundi", currency: "BIF" },
  { name: "Cambodia", currency: "KHR" },
  { name: "Cameroon", currency: "XAF" },
  { name: "Canada", currency: "CAD" },
  { name: "Cape Verde", currency: "CVE" },
  { name: "Central African Republic", currency: "XAF" },
  { name: "Chad", currency: "XAF" },
  { name: "Chile", currency: "CLP" },
  { name: "China", currency: "CNY" },
  { name: "Colombia", currency: "COP" },
  { name: "Comoros", currency: "KMF" },
  { name: "Congo", currency: "XAF" },
  { name: "Costa Rica", currency: "CRC" },
  { name: "Croatia", currency: "EUR" },
  { name: "Cuba", currency: "CUP" },
  { name: "Cyprus", currency: "EUR" },
  { name: "Czech Republic", currency: "CZK" },
  { name: "Denmark", currency: "DKK" },
  { name: "Djibouti", currency: "DJF" },
  { name: "Dominica", currency: "XCD" },
  { name: "Dominican Republic", currency: "DOP" },
  { name: "East Timor", currency: "USD" },
  { name: "Ecuador", currency: "USD" },
  { name: "Egypt", currency: "EGP" },
  { name: "El Salvador", currency: "USD" },
  { name: "Equatorial Guinea", currency: "XAF" },
  { name: "Eritrea", currency: "ERN" },
  { name: "Estonia", currency: "EUR" },
  { name: "Eswatini", currency: "SZL" },
  { name: "Ethiopia", currency: "ETB" },
  { name: "Fiji", currency: "FJD" },
  { name: "Finland", currency: "EUR" },
  { name: "France", currency: "EUR" },
  { name: "Gabon", currency: "XAF" },
  { name: "Gambia", currency: "GMD" },
  { name: "Georgia", currency: "GEL" },
  { name: "Germany", currency: "EUR" },
  { name: "Ghana", currency: "GHS" },
  { name: "Greece", currency: "EUR" },
  { name: "Grenada", currency: "XCD" },
  { name: "Guatemala", currency: "GTQ" },
  { name: "Guinea", currency: "GNF" },
  { name: "Guinea-Bissau", currency: "XOF" },
  { name: "Guyana", currency: "GYD" },
  { name: "Haiti", currency: "HTG" },
  { name: "Honduras", currency: "HNL" },
  { name: "Hong Kong", currency: "HKD" },
  { name: "Hungary", currency: "HUF" },
  { name: "Iceland", currency: "ISK" },
  { name: "India", currency: "INR" },
  { name: "Indonesia", currency: "IDR" },
  { name: "Iran", currency: "IRR" },
  { name: "Iraq", currency: "IQD" },
  { name: "Ireland", currency: "EUR" },
  { name: "Israel", currency: "ILS" },
  { name: "Italy", currency: "EUR" },
  { name: "Ivory Coast", currency: "XOF" },
  { name: "Jamaica", currency: "JMD" },
  { name: "Japan", currency: "JPY" },
  { name: "Jordan", currency: "JOD" },
  { name: "Kazakhstan", currency: "KZT" },
  { name: "Kenya", currency: "KES" },
  { name: "Kiribati", currency: "AUD" },
  { name: "Kuwait", currency: "KWD" },
  { name: "Kyrgyzstan", currency: "KGS" },
  { name: "Laos", currency: "LAK" },
  { name: "Latvia", currency: "EUR" },
  { name: "Lebanon", currency: "LBP" },
  { name: "Lesotho", currency: "LSL" },
  { name: "Liberia", currency: "LRD" },
  { name: "Libya", currency: "LYD" },
  { name: "Liechtenstein", currency: "CHF" },
  { name: "Lithuania", currency: "EUR" },
  { name: "Luxembourg", currency: "EUR" },
  { name: "Macau", currency: "MOP" },
  { name: "Madagascar", currency: "MGA" },
  { name: "Malawi", currency: "MWK" },
  { name: "Malaysia", currency: "MYR" },
  { name: "Maldives", currency: "MVR" },
  { name: "Mali", currency: "XOF" },
  { name: "Malta", currency: "EUR" },
  { name: "Marshall Islands", currency: "USD" },
  { name: "Mauritania", currency: "MRU" },
  { name: "Mauritius", currency: "MUR" },
  { name: "Mexico", currency: "MXN" },
  { name: "Micronesia", currency: "USD" },
  { name: "Moldova", currency: "MDL" },
  { name: "Monaco", currency: "EUR" },
  { name: "Mongolia", currency: "MNT" },
  { name: "Montenegro", currency: "EUR" },
  { name: "Morocco", currency: "MAD" },
  { name: "Mozambique", currency: "MZN" },
  { name: "Myanmar", currency: "MMK" },
  { name: "Namibia", currency: "NAD" },
  { name: "Nauru", currency: "AUD" },
  { name: "Nepal", currency: "NPR" },
  { name: "Netherlands", currency: "EUR" },
  { name: "New Zealand", currency: "NZD" },
  { name: "Nicaragua", currency: "NIO" },
  { name: "Niger", currency: "XOF" },
  { name: "Nigeria", currency: "NGN" },
  { name: "North Korea", currency: "KPW" },
  { name: "North Macedonia", currency: "MKD" },
  { name: "Norway", currency: "NOK" },
  { name: "Oman", currency: "OMR" },
  { name: "Pakistan", currency: "PKR" },
  { name: "Palau", currency: "USD" },
  { name: "Palestine", currency: "ILS" },
  { name: "Panama", currency: "PAB" },
  { name: "Papua New Guinea", currency: "PGK" },
  { name: "Paraguay", currency: "PYG" },
  { name: "Peru", currency: "PEN" },
  { name: "Philippines", currency: "PHP" },
  { name: "Poland", currency: "PLN" },
  { name: "Portugal", currency: "EUR" },
  { name: "Qatar", currency: "QAR" },
  { name: "Romania", currency: "RON" },
  { name: "Russia", currency: "RUB" },
  { name: "Rwanda", currency: "RWF" },
  { name: "Saint Kitts and Nevis", currency: "XCD" },
  { name: "Saint Lucia", currency: "XCD" },
  { name: "Saint Vincent", currency: "XCD" },
  { name: "Samoa", currency: "WST" },
  { name: "San Marino", currency: "EUR" },
  { name: "Sao Tome and Principe", currency: "STN" },
  { name: "Saudi Arabia", currency: "SAR" },
  { name: "Senegal", currency: "XOF" },
  { name: "Serbia", currency: "RSD" },
  { name: "Seychelles", currency: "SCR" },
  { name: "Sierra Leone", currency: "SLE" },
  { name: "Singapore", currency: "SGD" },
  { name: "Slovakia", currency: "EUR" },
  { name: "Slovenia", currency: "EUR" },
  { name: "Solomon Islands", currency: "SBD" },
  { name: "Somalia", currency: "SOS" },
  { name: "South Africa", currency: "ZAR" },
  { name: "South Korea", currency: "KRW" },
  { name: "South Sudan", currency: "SSP" },
  { name: "Spain", currency: "EUR" },
  { name: "Sri Lanka", currency: "LKR" },
  { name: "Sudan", currency: "SDG" },
  { name: "Suriname", currency: "SRD" },
  { name: "Sweden", currency: "SEK" },
  { name: "Switzerland", currency: "CHF" },
  { name: "Syria", currency: "SYP" },
  { name: "Taiwan", currency: "TWD" },
  { name: "Tajikistan", currency: "TJS" },
  { name: "Tanzania", currency: "TZS" },
  { name: "Thailand", currency: "THB" },
  { name: "Togo", currency: "XOF" },
  { name: "Tonga", currency: "TOP" },
  { name: "Trinidad and Tobago", currency: "TTD" },
  { name: "Tunisia", currency: "TND" },
  { name: "Turkey", currency: "TRY" },
  { name: "Turkmenistan", currency: "TMT" },
  { name: "Tuvalu", currency: "AUD" },
  { name: "Uganda", currency: "UGX" },
  { name: "Ukraine", currency: "UAH" },
  { name: "United Arab Emirates", currency: "AED" },
  { name: "United Kingdom", currency: "GBP" },
  { name: "United States", currency: "USD" },
  { name: "Uruguay", currency: "UYU" },
  { name: "Uzbekistan", currency: "UZS" },
  { name: "Vanuatu", currency: "VUV" },
  { name: "Vatican City", currency: "EUR" },
  { name: "Venezuela", currency: "VES" },
  { name: "Vietnam", currency: "VND" },
  { name: "Yemen", currency: "YER" },
  { name: "Zambia", currency: "ZMW" },
  { name: "Zimbabwe", currency: "ZWG" }
];

const currencyToOfficialCountry = {
  AFN: "Afghanistan",
  ALL: "Albania",
  DZD: "Algeria",
  EUR: "Eurozone",
  AOA: "Angola",
  XCD: "East Caribbean",
  ARS: "Argentina",
  AMD: "Armenia",
  AUD: "Australia",
  AZN: "Azerbaijan",
  BSD: "Bahamas",
  BHD: "Bahrain",
  BDT: "Bangladesh",
  BBD: "Barbados",
  BYN: "Belarus",
  BZD: "Belize",
  XOF: "West African CFA",
  BTN: "Bhutan",
  BOB: "Bolivia",
  BAM: "Bosnia and Herzegovina",
  BWP: "Botswana",
  BRL: "Brazil",
  BND: "Brunei",
  BGN: "Bulgaria",
  BIF: "Burundi",
  KHR: "Cambodia",
  XAF: "Central African CFA",
  CAD: "Canada",
  CVE: "Cape Verde",
  CLP: "Chile",
  CNY: "China",
  COP: "Colombia",
  KMF: "Comoros",
  CRC: "Costa Rica",
  CUP: "Cuba",
  CZK: "Czech Republic",
  DKK: "Denmark",
  DJF: "Djibouti",
  DOP: "Dominican Republic",
  USD: "United States",
  EGP: "Egypt",
  ERN: "Eritrea",
  SZL: "Eswatini",
  ETB: "Ethiopia",
  FJD: "Fiji",
  GMD: "Gambia",
  GEL: "Georgia",
  GHS: "Ghana",
  GTQ: "Guatemala",
  GNF: "Guinea",
  GYD: "Guyana",
  HTG: "Haiti",
  HNL: "Honduras",
  HKD: "Hong Kong",
  HUF: "Hungary",
  ISK: "Iceland",
  INR: "India",
  IDR: "Indonesia",
  IRR: "Iran",
  IQD: "Iraq",
  ILS: "Israel",
  JMD: "Jamaica",
  JPY: "Japan",
  JOD: "Jordan",
  KZT: "Kazakhstan",
  KES: "Kenya",
  KWD: "Kuwait",
  KGS: "Kyrgyzstan",
  LAK: "Laos",
  LBP: "Lebanon",
  LSL: "Lesotho",
  LRD: "Liberia",
  LYD: "Libya",
  CHF: "Switzerland",
  MOP: "Macau",
  MGA: "Madagascar",
  MWK: "Malawi",
  MYR: "Malaysia",
  MVR: "Maldives",
  MRU: "Mauritania",
  MUR: "Mauritius",
  MXN: "Mexico",
  MDL: "Moldova",
  MNT: "Mongolia",
  MAD: "Morocco",
  MZN: "Mozambique",
  MMK: "Myanmar",
  NAD: "Namibia",
  NPR: "Nepal",
  NZD: "New Zealand",
  NIO: "Nicaragua",
  NGN: "Nigeria",
  KPW: "North Korea",
  MKD: "North Macedonia",
  NOK: "Norway",
  OMR: "Oman",
  PKR: "Pakistan",
  PAB: "Panama",
  PGK: "Papua New Guinea",
  PYG: "Paraguay",
  PEN: "Peru",
  PHP: "Philippines",
  PLN: "Poland",
  QAR: "Qatar",
  RON: "Romania",
  RUB: "Russia",
  RWF: "Rwanda",
  WST: "Samoa",
  SAR: "Saudi Arabia",
  RSD: "Serbia",
  SCR: "Seychelles",
  SLE: "Sierra Leone",
  SGD: "Singapore",
  SBD: "Solomon Islands",
  SOS: "Somalia",
  ZAR: "South Africa",
  KRW: "South Korea",
  SSP: "South Sudan",
  LKR: "Sri Lanka",
  SDG: "Sudan",
  SRD: "Suriname",
  SEK: "Sweden",
  SYP: "Syria",
  TWD: "Taiwan",
  TJS: "Tajikistan",
  TZS: "Tanzania",
  THB: "Thailand",
  TOP: "Tonga",
  TTD: "Trinidad and Tobago",
  TND: "Tunisia",
  TRY: "Turkey",
  TMT: "Turkmenistan",
  UGX: "Uganda",
  UAH: "Ukraine",
  AED: "United Arab Emirates",
  GBP: "United Kingdom",
  UYU: "Uruguay",
  UZS: "Uzbekistan",
  VUV: "Vanuatu",
  VES: "Venezuela",
  VND: "Vietnam",
  YER: "Yemen",
  ZMW: "Zambia",
  ZWG: "Zimbabwe"
};

// 🎯 Smart Interest Presets — ปุ่มลัดความสนใจที่ผู้ใช้กดเพิ่ม/ลบได้ทันที
const INTEREST_PRESETS = [
  {
    label: "🍜 กินเที่ยว",
    text: "ชื่นชอบอาหารท้องถิ่น ร้านอร่อยซ่อนตัว และตลาดอาหารพื้นเมือง"
  },
  {
    label: "📸 ถ่ายรูป",
    text: "ชอบจุดถ่ายรูปสวยๆ วิวทิวทัศน์ และมุมถ่ายภาพที่เป็นเอกลักษณ์"
  },
  {
    label: "🏛️ ประวัติศาสตร์",
    text: "สนใจประวัติศาสตร์ วัฒนธรรมโบราณ และสถานที่ทางศาสนา"
  },
  {
    label: "🛍️ ช้อปปิ้ง",
    text: "ชอบช้อปปิ้ง ตลาดท้องถิ่น และแหล่งรวมสินค้าแฟชั่น"
  },
  { label: "🌿 ธรรมชาติ", text: "ชอบธรรมชาติ ภูเขา ทะเล และกิจกรรม Outdoor" },
  {
    label: "🌃 ไนท์ไลฟ์",
    text: "ชอบบรรยากาศกลางคืน บาร์ และสถานบันเทิงยามค่ำ"
  },
  {
    label: "👨‍👩‍👧 ครอบครัว",
    text: "เดินทางกับครอบครัว เน้นกิจกรรมที่เหมาะกับเด็กและผู้สูงอายุ"
  },
  { label: "💆 พักผ่อน", text: "ชอบพักผ่อนแบบสบายๆ ไม่เร่งรีบ คาเฟ่ และสปา" }
];

function TravelPlanner() {
  const [formData, setFormData] = useState({
    destination: "Japan",
    departureDate: "",
    days: 1,
    travelers: 1,
    budget: "Economy",
    airlinePreference: "Full Service",
    travelStyle: "Sightseeing",
    interests: ""
  });

  const [tripResult, setTripResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exchangeData, setExchangeData] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [converterCurrency, setConverterCurrency] = useState("JPY");
  const [foreignAmount, setForeignAmount] = useState("25,000");
  const [savedTrips, setSavedTrips] = useState([]);
  const itineraryContainerRef = useRef(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [aiEditLoading, setAiEditLoading] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);

  // ดึงข้อมูลอัตราแลกเปลี่ยนจาก API
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await api.get("/exchange-rates");
        setExchangeData(response.data);
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, []);

  // 📚 โหลดรายการทริปที่บันทึกไว้จาก Backend ตั้งแต่ตอนเปิดหน้าเว็บ
  useEffect(() => {
    fetchTrips();
  }, []);

  // ซิงค์สกุลเงินอัตโนมัติเมื่อมีการเลือกประเทศฝั่งซ้าย
  useEffect(() => {
    if (formData.destination) {
      const matchedCountry = ALL_COUNTRIES.find(
        (c) => c.name === formData.destination
      );
      if (matchedCountry) {
        setConverterCurrency(matchedCountry.currency);
      }
    }
  }, [formData.destination]);

  const cleanNumberString = (str) => {
    return str.replace(/,/g, "");
  };

  const formatNumberWithCommas = (value) => {
    const clean = cleanNumberString(value);
    if (isNaN(clean) || clean === "") return value;
    const parts = clean.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumberWithCommas(rawValue);
    setForeignAmount(formattedValue);
  };

  const calculateToTHB = () => {
    const rawNumber = cleanNumberString(foreignAmount);
    if (!converterCurrency || !rawNumber || isNaN(rawNumber)) return null;
    if (!exchangeData?.rates) return null;

    const targetRateObj = exchangeData.rates.find(
      (item) => item.code === converterCurrency
    );
    if (!targetRateObj) return null;

    const result = parseFloat(rawNumber) / targetRateObj.rate;
    return result.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 🎯 toggle preset เข้า/ออกจาก interests — กดซ้ำคือเอาออก กดใหม่คือเพิ่มไปต่อท้าย
  const handlePresetClick = (presetText) => {
    setFormData((prev) => {
      const current = prev.interests.trim();
      const isActive = current.includes(presetText);

      if (isActive) {
        // เอา preset นี้ออก แล้วเก็บกวาดช่องว่าง/comma ที่เหลือให้สะอาด
        const cleaned = current
          .split(",")
          .map((part) => part.trim())
          .filter((part) => part && part !== presetText)
          .join(", ");
        return { ...prev, interests: cleaned };
      }

      const next = current ? `${current}, ${presetText}` : presetText;
      return { ...prev, interests: next };
    });
  };

  // 🎯 ฟังก์ชันจัดการชื่อในเครื่องคำนวณเงินให้แสดงผลเป็น "CODE (ชื่อประเทศภาษาอังกฤษ)"
  const getCleanCurrencyName = (currencyCode, rawName = "") => {
    // 1. ถ้ามีรหัสสกุลเงินนี้ใน currencyToOfficialCountry ให้ดึงชื่อประเทศภาษาอังกฤษมาใช้เลย
    if (currencyToOfficialCountry[currencyCode]) {
      return `${currencyCode} (${currencyToOfficialCountry[currencyCode]})`;
    }

    // 2. ถ้าไม่มี (กรณีหลุด QC) ให้ล้างชื่อซ้ำๆ จาก API แล้วแสดงตามมีตามเกิด
    const cleanName =
      rawName.includes(" - ") &&
      rawName.split(" - ")[0] === rawName.split(" - ")[1]
        ? rawName.split(" - ")[0]
        : rawName;
    return cleanName ? `${currencyCode} (${cleanName})` : currencyCode;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTripResult(null);

    try {
      const response = await api.post("/trips/generate-trip", formData);
      setTripResult(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  };

  // 📚 ดึงรายการทริปที่บันทึกไว้ทั้งหมดจาก Backend
  const fetchTrips = async () => {
    try {
      const response = await api.get("/trips");
      setSavedTrips(response.data);
    } catch (err) {
      console.error("โหลดรายการทริปไม่สำเร็จ:", err);
    }
  };

  const handleSaveTrip = async () => {
    if (!tripResult) return;

    try {
      await api.post("/trips/save-trip", tripResult);
      alert("🎉 บันทึกทริปสำเร็จ");
      // โหลดรายการใหม่จาก Backend เพื่อให้ได้ id ที่เอาไว้เปิด/ลบ/แก้ไขได้จริง
      fetchTrips();
    } catch (err) {
      console.error(err);
      // axios จะ throw error เมื่อ response ไม่ใช่ 2xx เลยอ่านข้อความจาก backend ได้เลย
      const msg = err.response?.data?.error || "เชื่อมต่อ Backend ไม่ได้";
      alert("❌ " + msg);
    }
  };

  // 📂 เปิดทริปเก่ากลับมาดูอีกครั้ง
  const handleOpenTrip = (trip) => {
    setTripResult(trip);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🗑 ลบทริปออกจากระบบ
  const handleDeleteTrip = async (id) => {
    if (!id) {
      alert(
        "ทริปนี้ยังไม่มี ID จาก Backend เลยลบไม่ได้ ลองรีเฟรชหน้าเว็บก่อนนะ"
      );
      return;
    }

    const confirmed = window.confirm("ต้องการลบทริปนี้จริง ๆ ใช่ไหม?");
    if (!confirmed) return;

    try {
      await api.delete(`/trips/${id}`);
      fetchTrips(); // โหลดรายการใหม่หลังลบเสร็จ
    } catch (err) {
      console.error("ลบทริปไม่สำเร็จ:", err);
      alert("❌ ลบทริปไม่สำเร็จ");
    }
  };

  // ✏️ ให้ AI ช่วยแก้ไขทริปเฉพาะจุดที่เราอยากเปลี่ยน
  const handleEditTrip = async (trip) => {
    const editRequest = window.prompt(
      "อยากให้ AI แก้ไขอะไรในทริปนี้?\n(เช่น: เปลี่ยนวันที่ 3 ไปเที่ยวภูเขาไฟฟูจิ)"
    );

    // ถ้ากดยกเลิก หรือไม่ได้พิมพ์อะไรเลย ก็ไม่ต้องทำอะไรต่อ
    if (!editRequest || !editRequest.trim()) return;

    try {
      setAiEditLoading(true);
      const response = await api.post("/trips/edit-trip", {
        oldTrip: trip,
        editRequest: editRequest
      });

      // แสดงทริปเวอร์ชันที่ AI แก้ไขแล้วทันที
      setTripResult(response.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("AI แก้ไขทริปไม่สำเร็จ:", err);
      alert("❌ AI แก้ไขทริปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setAiEditLoading(false);
    }
  };

  // 🤖 AI Re-Plan Trip — ให้ AI จัดเรียงเส้นทางใหม่ทั้งทริปแบบ optimize
  const handleRePlan = async () => {
    if (!tripResult) return;

    const confirmed = window.confirm(
      "🤖 AI จะจัดเรียงเส้นทางทั้งทริปใหม่ทั้งหมด (กิจกรรมอาจสลับลำดับ/เปลี่ยนแปลงได้)\n\nต้องการดำเนินการต่อหรือไม่?"
    );
    if (!confirmed) return;

    setIsReplanning(true);
    try {
      const response = await api.post("/trips/replan", {
        trip: tripResult
      });

      setTripResult((prev) => ({
        ...prev,
        ...response.data
      }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      alert("✅ AI Re-Plan สำเร็จ");
    } catch (error) {
      console.error("RePlan Error:", error);
      alert("❌ Re-Plan ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsReplanning(false);
    }
  };

  const handleExportItineraryPDF = async () => {
    if (!itineraryContainerRef.current) return;
    setIsExportingPDF(true);
    try {
      const element = itineraryContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Trip_Plan_${formData.destination}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("ไม่สามารถส่งออก PDF ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const mainCurrencies = [
    "JPY",
    "TWD",
    "KRW",
    "SGD",
    "HKD",
    "CNY",
    "VND",
    "GBP",
    "USD",
    "AUD"
  ];

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          boxSizing: "border-box",
          padding: "20px"
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {!tripResult && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "25px" }}
            >
              {/* 🤖 1. ส่วนหัวหน้าปกแอป */}
              <div
                style={{
                  display: "flex",
                  height: "180px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  position: "relative"
                }}
              >
                <div
                  style={{
                    flex: "1",
                    backgroundImage: `url(${cloudsBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />
                <div
                  style={{
                    flex: "1",
                    backgroundImage: `url(${planeBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    textAlign: "center",
                    padding: "20px",
                    zIndex: 2,
                    textShadow: "2px 2px 8px rgba(0,0,0,0.8)"
                  }}
                >
                  <h1
                    style={{
                      margin: "0 0 5px 0",
                      fontSize: "30px",
                      fontWeight: "800"
                    }}
                  >
                    🤖 AI Travel Planner & Flight Matcher 🚀
                  </h1>
                  <p
                    style={{ margin: "0", fontSize: "15px", fontWeight: "500" }}
                  >
                    ค้นหาเที่ยวบินที่ใช่ จัดแจงทริปที่ชอบในไม่กี่วินาที
                  </p>
                </div>
              </div>

              {/* 🗺️ 2. ส่วนฟอร์มกรอกข้อมูลการเดินทาง */}
              <div
                style={{
                  backgroundColor: "white",
                  padding: "30px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
                }}
              >
                <h2
                  style={{
                    margin: "0 0 10px 0",
                    color: "#0284c7",
                    fontSize: "24px",
                    fontWeight: "bold"
                  }}
                >
                  🗺️ กรอกรายละเอียดการเดินทางของคุณ
                </h2>
                <p
                  style={{
                    margin: "0 0 25px 0",
                    color: "#666",
                    fontSize: "14px"
                  }}
                >
                  กรอกข้อมูลเพื่อให้ AI
                  อัจฉริยะช่วยออกแบบตารางท่องเที่ยวและค้นหาสายการบินที่คุ้มค่าที่สุด
                </p>

                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px"
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px"
                    }}
                  >
                    {/* 🎯 ช่องเลือกประเทศทั่วโลก A-Z */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                      }}
                    >
                      <label
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#444"
                        }}
                      >
                        ✈️ จุดหมายปลายทาง
                      </label>
                      <select
                        name="destination"
                        value={formData.destination}
                        onChange={handleInputChange}
                        required
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px",
                          background: "#fff"
                        }}
                      >
                        {ALL_COUNTRIES.map((country) => (
                          <option key={country.name} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                      }}
                    >
                      <label
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#444"
                        }}
                      >
                        📅 วันที่ออกเดินทาง
                      </label>
                      <input
                        type="date"
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleInputChange}
                        required
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px"
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                      }}
                    >
                      <label
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#444"
                        }}
                      >
                        ⏳ จำนวนวันเดินทาง (1-30 วัน)
                      </label>
                      <input
                        type="number"
                        name="days"
                        min="1"
                        max="30"
                        value={formData.days}
                        onChange={handleInputChange}
                        required
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px"
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                      }}
                    >
                      <label
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#444"
                        }}
                      >
                        👥 จำนวนผู้เดินทาง (คน)
                      </label>
                      <input
                        type="number"
                        name="travelers"
                        min="1"
                        value={formData.travelers}
                        onChange={handleInputChange}
                        required
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px"
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                      }}
                    >
                      <label
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#444"
                        }}
                      >
                        💰 ระดับงบประมาณ
                      </label>
                      <select
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px",
                          background: "#fff"
                        }}
                      >
                        <option value="Economy">Economy (แบบประหยัด)</option>
                        <option value="Standard">Standard (แบบปานกลาง)</option>
                        <option value="Luxury">Luxury (แบบหรูหรา)</option>
                      </select>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                      }}
                    >
                      <label
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#444"
                        }}
                      >
                        🎫 รูปแบบสายการบิน
                      </label>
                      <select
                        name="airlinePreference"
                        value={formData.airlinePreference}
                        onChange={handleInputChange}
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px",
                          background: "#fff"
                        }}
                      >
                        <option value="Low-cost">
                          Low-cost — แบบประหยัดสุดคุ้ม (เช่น AirAsia, VietJet,
                          Nok Air)
                        </option>
                        <option value="Full Service">
                          Full Service — แบบบริการครบวงจร (เช่น Thai Airways,
                          ANA, JAL)
                        </option>
                        <option value="Luxury/First Class">
                          Luxury / First Class — แบบพรีเมียม (เช่น Emirates,
                          Singapore Airlines, Qatar)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px"
                    }}
                  >
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#444"
                      }}
                    >
                      🎭 สไตล์การท่องเที่ยว
                    </label>
                    <select
                      name="travelStyle"
                      value={formData.travelStyle}
                      onChange={handleInputChange}
                      style={{
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        fontSize: "14px",
                        background: "#fff"
                      }}
                    >
                      <option value="Sightseeing">
                        Sightseeing (เน้นแลนด์มาร์คถ่ายรูป)
                      </option>
                      <option value="Adventure">
                        Adventure (ชมธรรมชาติ แอดเวนเจอร์)
                      </option>
                      <option value="Relaxing">
                        Relaxing (พักผ่อนชิลๆ ไม่เร่งรีบ)
                      </option>
                      <option value="Shopping & Food">
                        Shopping & Food (เน้นช้อปปิ้ง หาของกินอร่อย)
                      </option>
                      <option value="Culture & History">
                        Culture & History (ประวัติศาสตร์และวัฒนธรรมโบราณ)
                      </option>
                      <option value="Business">
                        Business (เดินทางเชิงธุรกิจ แวะทำงาน)
                      </option>
                    </select>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px"
                    }}
                  >
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#444"
                      }}
                    >
                      🎯 ออกแบบทริปของคุณ
                    </label>

                    {/* 🌟 Smart Interest Presets — กดเพื่อเพิ่ม/ลบความสนใจอย่างรวดเร็ว */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "8px"
                      }}
                    >
                      {INTEREST_PRESETS.map((preset) => {
                        const isActive = formData.interests.includes(
                          preset.text
                        );
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handlePresetClick(preset.text)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              border: isActive
                                ? "1.5px solid #0284c7"
                                : "1.5px solid #e2e8f0",
                              backgroundColor: isActive ? "#e0f2fe" : "#f8fafc",
                              color: isActive ? "#0369a1" : "#475569",
                              fontSize: "13px",
                              fontWeight: isActive ? "700" : "500",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      name="interests"
                      value={formData.interests}
                      placeholder="ระบุสถานที่ท่องเที่ยว, สิ่งที่อยากทำ, เมืองที่อยากไป หรือความสนใจพิเศษ"
                      onChange={handleInputChange}
                      style={{
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        fontSize: "14px",
                        minHeight: "80px",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: "10px",
                      padding: "14px",
                      backgroundColor: loading ? "#ffcccb" : "#ff4d4f",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(255, 77, 79, 0.3)"
                    }}
                  >
                    {loading
                      ? "⏳ กำลังคำนวณและจัดทริปด้วย AI..."
                      : "ค้นหาเที่ยวบินและวางแผนเที่ยวได้เลย!"}
                  </button>

                  {error && (
                    <div
                      style={{
                        padding: "10px",
                        backgroundColor: "#fde8e8",
                        borderRadius: "6px",
                        color: "#e53e3e",
                        fontSize: "14px",
                        textAlign: "center"
                      }}
                    >
                      {error}
                    </div>
                  )}
                </form>
              </div>

              {/* 💵 3. เครื่องคำนวณเงินด่วนประจำทริป */}
              <div
                style={{
                  backgroundColor: "white",
                  padding: "30px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
                }}
              >
                <h2
                  style={{
                    margin: "0 0 5px 0",
                    color: "#333",
                    fontSize: "22px",
                    fontWeight: "bold"
                  }}
                >
                  💵 ระบบคำนวณอัตราแลกเปลี่ยน
                </h2>
                <p
                  style={{
                    margin: "0 0 20px 0",
                    color: "#666",
                    fontSize: "13px"
                  }}
                >
                  {ratesLoading
                    ? "⏳ กำลังโหลดเรตสดจากตลาดโลก..."
                    : "คำนวณและเปรียบเทียบสกุลเงินต่างประเทศแบบ Real Time"}
                </p>

                <div
                  style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
                >
                  <input
                    type="text"
                    placeholder="ใส่จำนวนเงินต่างประเทศ"
                    value={foreignAmount}
                    onChange={handleAmountChange}
                    style={{
                      flex: "1.5",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "14px"
                    }}
                  />

                  <select
                    value={converterCurrency}
                    onChange={(e) => setConverterCurrency(e.target.value)}
                    style={{
                      flex: "1",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      background: "#fff",
                      fontSize: "14px"
                    }}
                  >
                    <option value="">-- สกุลเงิน --</option>

                    {exchangeData?.rates
                      ?.filter((item) => currencyToOfficialCountry[item.code])
                      ?.map((item) => (
                        <option key={item.code} value={item.code}>
                          {getCleanCurrencyName(item.code)}
                        </option>
                      ))}
                  </select>
                </div>

                <div
                  style={{
                    background: "#f0fdf4",
                    padding: "18px",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    textAlign: "center",
                    marginBottom: "25px"
                  }}
                >
                  {(() => {
                    const resultTHB = calculateToTHB();
                    if (resultTHB === null) {
                      return (
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#166534",
                            fontWeight: "bold"
                          }}
                        >
                          รอระบุจำนวนเงินและเลือกสกุลเงินด้านบน
                        </span>
                      );
                    }
                    return (
                      <>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#166534",
                            display: "block",
                            marginBottom: "2px"
                          }}
                        >
                          คิดเป็นเงินไทยประมาณ
                        </span>
                        <strong style={{ fontSize: "26px", color: "#15803d" }}>
                          {resultTHB}{" "}
                          <span
                            style={{ fontSize: "15px", fontWeight: "bold" }}
                          >
                            THB
                          </span>
                        </strong>
                      </>
                    );
                  })()}
                </div>

                {/* 📊 4. ตารางอัตราแลกเปลี่ยนเฉพาะประเทศยอดฮิต (2 คอลัมน์) */}
                <div style={{ marginTop: "20px" }}>
                  <h3
                    style={{
                      margin: "0 0 12px 0",
                      color: "#444",
                      fontSize: "15px",
                      fontWeight: "bold"
                    }}
                  >
                    💱 อัตราแลกเปลี่ยนเงินตราต่างประเทศ (THB)
                  </h3>
                  <div
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      overflow: "hidden"
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "14px",
                        textAlign: "left"
                      }}
                    >
                      <thead style={{ backgroundColor: "#f9f9f9" }}>
                        <tr>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: "#666",
                              borderBottom: "1px solid #eee",
                              fontWeight: "600"
                            }}
                          >
                            สกุลเงิน
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: "#666",
                              borderBottom: "1px solid #eee",
                              textAlign: "right",
                              fontWeight: "600"
                            }}
                          >
                            อัตราแลกเปลี่ยน
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratesLoading ? (
                          <tr>
                            <td
                              colSpan="2"
                              style={{
                                padding: "16px",
                                textAlign: "center",
                                color: "#999"
                              }}
                            >
                              กำลังโหลดข้อมูลดัชนีโลก...
                            </td>
                          </tr>
                        ) : (
                          exchangeData?.rates
                            ?.filter((item) =>
                              mainCurrencies.includes(item.code)
                            )
                            ?.map((item) => (
                              <tr
                                key={item.code}
                                style={{ borderBottom: "1px solid #eee" }}
                              >
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontWeight: "700",
                                    color: "#0f172a"
                                  }}
                                >
                                  1 {item.code}{" "}
                                  <span
                                    style={{
                                      fontWeight: "500",
                                      color: "#475569"
                                    }}
                                  >
                                    (
                                    {currencyToOfficialCountry[item.code] ||
                                      item.name}
                                    )
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    textAlign: "right",
                                    fontWeight: "700",
                                    color: "#0f172a",
                                    fontSize: "15px"
                                  }}
                                >
                                  {(1 / item.rate).toFixed(4)}{" "}
                                  <span
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: "500",
                                      color: "#64748b"
                                    }}
                                  >
                                    THB
                                  </span>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✈️ ทริปที่บันทึกไว้ของฉัน (My Trips) — แสดงเฉพาะหน้าแรก */}
          {!tripResult && (
            <div
              style={{
                marginTop: "20px",
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                marginBottom: "20px"
              }}
            >
              <h2 style={{ margin: "0 0 15px 0", color: "#0284c7" }}>
                📚 ทริปที่บันทึกไว้ของฉัน (My Trips)
              </h2>

              {savedTrips.length === 0 ? (
                <p style={{ color: "#666" }}>ยังไม่มีทริปที่บันทึกไว้</p>
              ) : (
                savedTrips.map((trip, index) => (
                  <div
                    key={trip.id ?? index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      background: "#fafafa"
                    }}
                  >
                    <div style={{ minWidth: "180px" }}>
                      <h3
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "16px",
                          color: "#0f172a"
                        }}
                      >
                        {trip.tripName || trip.destination || "My Trip"}
                      </h3>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "13px",
                          color: "#666"
                        }}
                      >
                        📍 {trip.destination}
                        {trip.totalDays ? ` | ⏳ ${trip.totalDays} วัน` : ""}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap"
                      }}
                    >
                      <button
                        onClick={() => handleOpenTrip(trip)}
                        style={{
                          padding: "8px 14px",
                          backgroundColor: "#0284c7",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "bold"
                        }}
                      >
                        📂 เปิดทริป
                      </button>

                      <button
                        onClick={() => handleEditTrip(trip)}
                        disabled={aiEditLoading}
                        style={{
                          padding: "8px 14px",
                          backgroundColor: aiEditLoading
                            ? "#bdc3c7"
                            : "#8b5cf6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: aiEditLoading ? "not-allowed" : "pointer",
                          fontSize: "13px",
                          fontWeight: "bold"
                        }}
                      >
                        {aiEditLoading ? "⏳ AI กำลังแก้..." : "✏️ AI Edit"}
                      </button>

                      <button
                        onClick={() => handleDeleteTrip(trip.id)}
                        style={{
                          padding: "8px 14px",
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "bold"
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 📜 ส่วนแสดงตารางผลทริปเมื่อ AI ตอบกลับสำเร็จ */}
          {tripResult && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ marginBottom: "20px" }}>
                <button
                  onClick={() => setTripResult(null)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "white",
                    color: "#0284c7",
                    border: "2px solid #0284c7",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  ⬅️ กลับไปแก้ไขฟอร์มจัดทริปใหม่
                </button>
              </div>

              <div
                ref={itineraryContainerRef}
                style={{
                  backgroundColor: "white",
                  padding: "35px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 25px rgba(0,0,0,0.05)"
                }}
              >
                <div
                  style={{
                    borderBottom: "2px solid #efefef",
                    paddingBottom: "15px",
                    marginBottom: "25px"
                  }}
                >
                  <h1
                    style={{
                      margin: "0 0 10px 0",
                      color: "#0284c7",
                      fontSize: "30px",
                      fontWeight: "bold"
                    }}
                  >
                    {tripResult.tripName || "แผนการท่องเที่ยวส่วนตัวของคุณ"}
                  </h1>
                  <p style={{ margin: "0", color: "#555", fontSize: "15px" }}>
                    📍 จุดหมาย: <strong>{tripResult.destination}</strong> | ⏳
                    จำนวน: <strong>{tripResult.totalDays} วัน</strong> | 💰
                    งบโดยรวม: <strong>{tripResult.budgetLevel}</strong>
                  </p>
                </div>

                <BudgetSummary
                  tripResult={tripResult}
                  exchangeData={exchangeData}
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "30px",
                    marginTop: "25px"
                  }}
                >
                  {tripResult.itinerary?.map((dayPlan) => (
                    <div
                      key={dayPlan.day}
                      style={{
                        borderLeft: "4px solid #0284c7",
                        paddingLeft: "15px"
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 12px 0",
                          color: "#0284c7",
                          fontSize: "18px",
                          fontWeight: "bold"
                        }}
                      >
                        🗓️ วันที่ {dayPlan.day} - {dayPlan.theme}
                      </h3>
                      <ul
                        style={{
                          listStyleType: "none",
                          padding: "0",
                          margin: "0",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px"
                        }}
                      >
                        {dayPlan.activities?.map((activity, actIdx) => (
                          <li
                            key={actIdx}
                            style={{
                              backgroundColor: "#fdfdfd",
                              padding: "12px 15px",
                              borderRadius: "6px",
                              border: "1px solid #f0f0f0"
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "bold",
                                color: "#e53e3e",
                                marginRight: "10px"
                              }}
                            >
                              ⏰{" "}
                              {activity.startTime
                                ? `${activity.startTime}${
                                    activity.endTime
                                      ? ` - ${activity.endTime}`
                                      : ""
                                  }`
                                : activity.time || "ไม่ระบุเวลา"}
                            </span>
                            <strong style={{ fontSize: "15px" }}>
                              {activity.locationName}
                            </strong>
                            <p
                              style={{
                                margin: "5px 0",
                                color: "#555",
                                fontSize: "14px",
                                lineHeight: "1.5"
                              }}
                            >
                              {activity.description}
                            </p>
                            <small
                              style={{ color: "#38a169", fontWeight: "bold" }}
                            >
                              💰 ค่าใช้จ่ายโดยประมาณ:{" "}
                              {activity.displayCost ||
                                (activity.estimatedCost !== undefined
                                  ? `${activity.estimatedCost.toLocaleString()} THB`
                                  : "ไม่ระบุ")}
                            </small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: "30px",
                    textAlign: "center",
                    borderTop: "2px dashed #e0e0e0",
                    paddingTop: "20px"
                  }}
                >
                  <button
                    onClick={handleRePlan}
                    disabled={isReplanning}
                    style={{
                      width: "100%",
                      padding: "15px",
                      backgroundColor: isReplanning ? "#c4b5fd" : "#8b5cf6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isReplanning ? "not-allowed" : "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                      marginBottom: "15px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                  >
                    {isReplanning
                      ? "⏳ AI กำลังจัดเส้นทางใหม่..."
                      : "🤖 Re-Plan Trip"}
                  </button>

                  <button
                    onClick={handleSaveTrip}
                    style={{
                      width: "100%",
                      padding: "15px",
                      backgroundColor: "#ff4d4f",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                      marginBottom: "15px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                  >
                    ❤️ Save Trip
                  </button>

                  <button
                    onClick={handleExportItineraryPDF}
                    disabled={isExportingPDF}
                    style={{
                      width: "100%",
                      padding: "15px",
                      backgroundColor: isExportingPDF ? "#bdc3c7" : "#0284c7",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isExportingPDF ? "not-allowed" : "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                  >
                    {isExportingPDF
                      ? "⏳ กำลังแปลงตารางเดินทาง..."
                      : "📄 ดาวน์โหลดแผนการเดินทางรายวันทั้งหมด (PDF)"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default TravelPlanner;
