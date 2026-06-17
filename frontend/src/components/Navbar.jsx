import React from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div
      style={{
        backgroundColor: "#0284c7",
        color: "white",
        padding: "15px 25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "22px"
        }}
      >
        ✈️ AI Travel Planner
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px"
        }}
      >
        <span>👤 {user?.username || "Guest"}</span>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            padding: "8px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
