import React from "react";

export default function Placeholder({ title }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600">Contenu à venir…</p>
    </div>
  );
}
