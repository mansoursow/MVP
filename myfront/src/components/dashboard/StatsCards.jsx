import React from "react";

export default function StatsCards() {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Tableau de bord</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-gray-700 font-semibold">Total Ventes</h3>
          <p className="text-2xl font-bold text-[#2e615e]">990.000 FCFA</p>
          <img src="/chart-pie.png" alt="pie chart" className="w-full mt-2" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-gray-700 font-semibold">Total Achats</h3>
          <p className="text-2xl font-bold text-[#2e615e]">350.500 FCFA</p>
          <img src="/chart-bar.png" alt="bar chart" className="w-full mt-2" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-gray-700 font-semibold">Calendrier des échéances</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>01/08/2025 – TVA</li>
            <li>15/08/2025 – TIMBRE</li>
            <li>30/08/2025 – CEL VA</li>
            <li>30/08/2025 – CEL VA</li>
            <li>31/08/2025 – TIMBRE</li>
          </ul>
        </div>
      </div>
    </>
  );
}
