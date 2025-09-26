import React from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Tableau de bord", to: "/" },
  { label: "Ventes", to: "/ventes" },
  { label: "Caisse", to: "/caisse" },
  { label: "Achats", to: "/achats" },
  { label: "Écritures comptables", to: "/journal" },   // 👈 NEW
  { label: "Banque", to: "/banque" },
  { label: "Dossier permanent", to: "/dossier-permanent" },
  { label: "Paramètres", to: "/parametres" },
];

export default function Sidebar({ onToggleChat, chatVisible }) {
  return (
    <aside className="w-64 bg-[#2e615e] text-white flex flex-col justify-between py-6">
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">Accountech AI</h2>
        <h3 className="text-sm font-bold mb-6 px-6" style={{ color: "#BFFFDF" }}>
          Menu principal
        </h3>

        <nav className="space-y-2 px-6">
          {menuItems.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "block w-full text-left px-6 py-2 rounded-full transition",
                  "border border-transparent",
                  isActive
                    ? "bg-[#BFFFDF] text-[#2e615e]"
                    : "bg-white text-[#2e615e] hover:bg-[#BFFFDF]",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 px-6">
          <button
            onClick={onToggleChat}
            className="w-full border border-white rounded-full py-2 flex items-center justify-center hover:bg[#cf9077]"
          >
            <span className="mr-2">🧠</span>
            {chatVisible ? "Fermer l'IA" : "Assistant IA"}
          </button>
        </div>
      </div>

      <div className="px-6">
        <button className="w-full bg-[#f0c84b] text-[#2e615e] font-bold py-2 rounded-full">
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
