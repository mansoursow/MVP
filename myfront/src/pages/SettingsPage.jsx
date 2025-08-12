// src/pages/SettingsPage.jsx
import React, { useState } from "react";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("Sonatel company");
  const [email, setEmail] = useState("contact@sonatel.com");
  const [phone, setPhone] = useState("+221 77 000 00 00");
  const [address, setAddress] = useState("Dakar, Sénégal");

  const handleSave = () => {
    alert("Paramètres enregistrés ✅");
    // 🔹 Ici, tu pourrais envoyer les données à ton backend
  };

  return (
    <div className="p-6">
      {/* Titre */}
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      {/* Carte principale */}
      <div className="bg-white shadow rounded-lg p-6 max-w-3xl">
        <h2 className="text-lg font-semibold mb-4 text-[#2e615e]">
          Informations de l’entreprise
        </h2>

        {/* Nom */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Nom de l’entreprise
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Téléphone */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Téléphone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Adresse */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            rows="2"
          ></textarea>
        </div>

        {/* Bouton sauvegarde */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-[#2e615e] text-white px-4 py-2 rounded hover:bg-[#24514e]"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Section autres paramètres */}
      <div className="bg-white shadow rounded-lg p-6 max-w-3xl mt-6">
        <h2 className="text-lg font-semibold mb-4 text-[#2e615e]">
          Sécurité
        </h2>

        <button className="border border-[#2e615e] text-[#2e615e] px-4 py-2 rounded hover:bg-[#BFFFDF]">
          Changer le mot de passe
        </button>
      </div>
    </div>
  );
}
