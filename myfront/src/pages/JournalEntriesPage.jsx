// src/pages/JournalEntriesPage.jsx
import React, { useMemo, useState } from "react";
import { generateJournalFromPurchases, DEFAULT_CHART, money } from "../utils/journal";

const STATUS_STYLES = {
  payee: "bg-green-100 text-green-700 border-green-300",
  en_retard: "bg-red-100 text-red-700 border-red-300",
  partielle: "bg-amber-100 text-amber-700 border-amber-300",
  brouillon: "bg-gray-100 text-gray-700 border-gray-300",
  en_attente: "bg-blue-100 text-blue-700 border-blue-300",
};
function Badge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.brouillon;
  const label = { payee: "Payée", en_retard: "En retard", partielle: "Partiellement payée", brouillon: "Brouillon", en_attente: "En attente" }[status] || "Brouillon";
  return <span className={`inline-block text-xs px-2 py-1 rounded-full border ${cls}`}>{label}</span>;
}
function SummaryCard({ title, value, hint, icon }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow flex items-start gap-3">
      <div className="text-xl" aria-hidden>{icon}</div>
      <div>
        <div className="text-sm text-gray-600">{title}</div>
        <div className="text-2xl font-bold text-[#2e615e]">{value}</div>
        {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function JournalEntriesPage({ purchases }) {
  // fallback si pas de props : données mock
  const basePurchases = purchases ?? [
    { id: 1, date: "2025-08-01", fournisseur: "SENCOM SARL", ref: "ACH-2025-001", ht: 320000, tva: 57600, ttc: 377600, mode: "virement", echeance: "2025-08-15", statut: "payee" },
    { id: 2, date: "2025-08-02", fournisseur: "Sonatel", ref: "ACH-2025-002", ht: 150000, tva: 27000, ttc: 177000, mode: "espece", echeance: "2025-08-12", statut: "en_attente" },
    { id: 3, date: "2025-08-05", fournisseur: "Office Depot", ref: "ACH-2025-003", ht: 90000, tva: 16200, ttc: 106200, mode: "carte", echeance: "2025-08-20", statut: "partielle", partiel: 50000 },
    { id: 4, date: "2025-08-06", fournisseur: "GA2C", ref: "ACH-2025-004", ht: 450000, tva: 81000, ttc: 531000, mode: "virement", echeance: "2025-08-10", statut: "en_retard" },
  ];

  const chart = DEFAULT_CHART;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [mode, setMode] = useState("all");
  const [period, setPeriod] = useState({ from: "", to: "" });

  const entries = useMemo(() => generateJournalFromPurchases(basePurchases, chart), [basePurchases]);
  const filtered = entries.filter((e) => {
    const okStatus = status === "all" ? true : e.status === status;
    const okMode = mode === "all" ? true : (e.meta?.mode === mode);
    const q = query.trim().toLowerCase();
    const okQ = !q || e.ref.toLowerCase().includes(q) || (e.meta?.fournisseur || "").toLowerCase().includes(q);
    const okFrom = !period.from || e.date >= period.from;
    const okTo = !period.to || e.date <= period.to;
    return okStatus && okMode && okQ && okFrom && okTo;
  });

  const totalDebit = filtered.reduce((s, e) => s + money(e.totalDebit), 0);
  const totalCredit = filtered.reduce((s, e) => s + money(e.totalCredit), 0);

  const [open, setOpen] = useState({});
  const toggle = (id) => setOpen((m) => ({ ...m, [id]: !m[id] }));

  const exportCSV = () => {
    const header = ["Date","Réf","Libellé","Compte","Intitulé","Débit","Crédit"];
    const rows = [];
    filtered.forEach(e => {
      e.lines.forEach(l => {
        rows.push([
          e.date,
          e.ref.replaceAll(",", " "),
          e.libelle.replaceAll(",", " "),
          l.compte,
          l.label.replaceAll(",", " "),
          money(l.debit).toFixed(2),
          money(l.credit).toFixed(2),
        ]);
      });
    });
    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white px-4 py-2 rounded-lg shadow">
        <h1 className="text-xl font-semibold">Écritures comptables</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3 py-2 text-sm rounded-lg border hover:bg-[#BFFFDF] hover:text-[#2e615e]">
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Résumés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="Nombre d’écritures" value={filtered.length} icon="📘" />
        <SummaryCard title="Total Débits" value={`${totalDebit.toLocaleString()} FCFA`} icon="➕" />
        <SummaryCard title="Total Crédits" value={`${totalCredit.toLocaleString()} FCFA`} icon="➖" />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="Rechercher fournisseur ou réf…" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="all">Tous statuts</option>
            <option value="payee">Payée</option>
            <option value="en_attente">En attente</option>
            <option value="partielle">Partiellement payée</option>
            <option value="en_retard">En retard</option>
            <option value="brouillon">Brouillon</option>
          </select>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="all">Tous modes</option>
            {["virement","espece","carte"].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="date" value={period.from} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={period.to} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#2e615e] text-white">
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Référence</th>
                <th className="px-3 py-2 text-left">Libellé</th>
                <th className="px-3 py-2 text-left">Statut</th>
                <th className="px-3 py-2 text-right">Débit</th>
                <th className="px-3 py-2 text-right">Crédit</th>
                <th className="px-3 py-2 text-right">Équilibre</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <React.Fragment key={e.id}>
                  <tr className={i % 2 ? "bg-[#fff7e6]" : ""}>
                    <td className="px-3 py-2">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2 font-medium">{e.ref}</td>
                    <td className="px-3 py-2">{e.libelle}</td>
                    <td className="px-3 py-2"><Badge status={e.status} /></td>
                    <td className="px-3 py-2 text-right">{e.totalDebit.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{e.totalCredit.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{e.equilibre ? "✅" : "⚠️"}</td>
                    <td className="px-3 py-2 text-right">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-[#BFFFDF]" onClick={() => toggle(e.id)}>
                        {open[e.id] ? "Replier" : "Détails"}
                      </button>
                    </td>
                  </tr>
                  {open[e.id] && (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="px-3 py-3">
                        <div className="overflow-auto">
                          <table className="min-w-[600px] text-xs">
                            <thead>
                              <tr className="text-gray-600">
                                <th className="px-2 py-1 text-left">Compte</th>
                                <th className="px-2 py-1 text-left">Intitulé</th>
                                <th className="px-2 py-1 text-right">Débit</th>
                                <th className="px-2 py-1 text-right">Crédit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {e.lines.map((l, k) => (
                                <tr key={k}>
                                  <td className="px-2 py-1">{l.compte}</td>
                                  <td className="px-2 py-1">{l.label}</td>
                                  <td className="px-2 py-1 text-right">{l.debit ? money(l.debit).toLocaleString() : "—"}</td>
                                  <td className="px-2 py-1 text-right">{l.credit ? money(l.credit).toLocaleString() : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-8">Aucune écriture pour ces filtres.</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={4}>Totaux</td>
                <td className="px-3 py-2 text-right">{totalDebit.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totalCredit.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        ⚙️ Plan comptable par défaut : 601 (achats), 44562 (TVA), 401 (fournisseurs), 512/571 (trésorerie).  
        👉 Adapte les numéros dans <code>src/utils/journal.js</code> si tu es strictement en SYSCOHADA.
      </div>
    </div>
  );
}
