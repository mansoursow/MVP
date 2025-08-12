import React from "react";

export default function HeaderBar() {
  return (
    <div className="flex justify-between items-center mb-6 bg-white px-4 py-2 rounded-lg shadow">
      <h1 className="text-xl font-semibold">Sonatel company</h1>
      <div className="flex items-center gap-4">
        <div className="bg-yellow-200 border border-yellow-500 px-4 py-2 rounded-full text-yellow-800 text-sm">
          ⚠️ Fichier mal téléchargé !
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Bienvenue, William !</span>
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="avatar"
            className="w-8 h-8 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
