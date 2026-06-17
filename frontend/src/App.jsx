import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import TravelPlanner from "./pages/TravelPlanner";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <TravelPlanner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="*"
          element={
            token ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
