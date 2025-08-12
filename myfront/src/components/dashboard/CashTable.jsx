import React from "react";

export default function CashTable() {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex items-center gap-4 mb-4">
        <select className="border rounded px-2 py-1 text-sm">
          <option>Date</option>
        </select>
        <select className="border rounded px-2 py-1 text-sm">
          <option>Libellé</option>
        </select>
        <select className="border rounded px-2 py-1 text-sm">
          <option>Encaissements</option>
        </select>
        <select className="border rounded px-2 py-1 text-sm">
          <option>Décaissements</option>
        </select>
        <select className="border rounded px-2 py-1 text-sm">
          <option>Solde</option>
        </select>

        <button className="ml-auto border rounded px-4 py-1 text-sm text-[#2e615e]">
          Export PDF
        </button>
        <button className="border rounded px-4 py-1 text-sm text-[#2e615e]">
          Export Excel
        </button>
        <button className="border rounded px-4 py-1 text-sm bg-[#2e615e] text-white">
          Ajouter
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#2e615e] text-white">
            <th className="px-2 py-1">N°</th>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Libellé</th>
            <th className="px-2 py-1">Encaissements</th>
            <th className="px-2 py-1">Décaissements</th>
            <th className="px-2 py-1">Solde</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="even:bg-yellow-100">
              <td className="px-2 py-1 text-center">{i + 1}</td>
              <td className="px-2 py-1 text-center">12/07/2025</td>
              <td className="px-2 py-1 text-center">{i % 2 === 0 ? "Vente" : "Caisse"}</td>
              <td className="px-2 py-1 text-center">550500</td>
              <td className="px-2 py-1 text-center">35000</td>
              <td className="px-2 py-1 text-center">515500</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right mt-2">
        <a
          href="https://www.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Afficher tout
        </a>
      </div>
    </div>
  );
}
