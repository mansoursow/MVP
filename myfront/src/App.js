import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import SalesPage from "./pages/SalesPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<Dashboard />} />
        <Route path="/*" element={<SalesPage />} />
      </Routes>
    </Router>
  );
}
