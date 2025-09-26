import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./layout/Sidebar";
import HeaderBar from "./layout/HeaderBar";
import StatsCards from "./dashboard/StatsCards";
import CashTable from "./dashboard/CashTable";

import ChatBot from "./ChatBot";
import SalesPage from "../pages/SalesPage";
import CashPage from "../pages/CashPage";
import PurchasesPage from "../pages/PurchasesPage";
import BankPage from "../pages/BankPage";
import PermanentFolderPage from "../pages/PermanentFolderPage";
import SettingsPage from "../pages/SettingsPage";
import JournalEntriesPage from "../pages/JournalEntriesPage";

function HomeContent() {
  return (
    <>
      <HeaderBar />
      <StatsCards />
      <CashTable />
      <div className="mt-4 text-right">
        <img src="/logo-sonatel.png" alt="sonatel" className="w-24 inline" />
      </div>
    </>
  );
}

export default function Dashboard() {
  const [chatVisible, setChatVisible] = useState(false);

  return (
    <div className="flex h-screen bg-[#d0ded9] font-sans relative">
      <Sidebar
        onToggleChat={() => setChatVisible(!chatVisible)}
        chatVisible={chatVisible}
      />

      <main className="flex-1 px-8 py-6 overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomeContent />} />
          <Route path="/ventes" element={<SalesPage />} />
          <Route path="/caisse" element={<CashPage />} />
          <Route path="/achats" element={<PurchasesPage />} />
          <Route path="/banque" element={<BankPage />} />
          <Route path="/journal" element={<JournalEntriesPage />} />
          <Route path="/dossier-permanent" element={<PermanentFolderPage />} />
          <Route path="/parametres" element={<SettingsPage />} />
        </Routes>
      </main>

      {chatVisible && <ChatBot />}
    </div>
  );
}
