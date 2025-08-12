// src/pages/PurchasesPage.jsx
import React, { useMemo, useState } from "react";

const STATUS_STYLES = {
  payee: "bg-green-100 text-green-700 border-green-300",
  en_retard: "bg-red-100 text-red-700 border-red-300",
  partielle: "bg-amber-100 text-amber-700 border-amber-300",
  brouillon: "bg-gray-100 text-gray-700 border-gray-300",
  en_attente: "bg-blue-100 text-blue-700 border-blue-300",
};

function Badge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.brouillon;
  const label =
    {
      payee: "Payée",
      en_retard: "En retard",
      partielle: "Partiellement payée",
      brouillon: "Brouillon",
      en_attente: "En attente",
    }[status] || "Brouillon";
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded-full border ${cls}`}>
      {label}
    </span>
  );
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

function AddPurchaseModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    fournisseur: "",
    ref: "",
    ht: "",
    tva: "",
    echeance: new Date().toISOString().slice(0, 10),
    statut: "en_attente",
    mode: "virement", // virement | espece | cheque | carte
    attachment: null,
  });

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      const file = files?.[0] || null;
      setForm((f) => ({ ...f, attachment: file }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const save = () => {
    const ht = parseFloat(form.ht || "0");
    const tva = parseFloat(form.tva || "0");
    if (!form.fournisseur || !form.ref || !ht) return;

    const payload = {
      id: Date.now(),
      date: form.date,
      fournisseur: form.fournisseur,
      ref: form.ref,
      ht,
      tva,
      ttc: ht + tva,
      mode: form.mode,
      echeance: form.echeance,
      statut: form.statut,
      attachment: form.attachment
        ? {
            name: form.attachment.name,
            url: URL.createObjectURL(form.attachment),
            size: form.attachment.size,
            type: form.attachment.type,
          }
        : null,
    };
    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Nouvel achat</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange}
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Échéance</label>
            <input type="date" name="echeance" value={form.echeance} onChange={handleChange}
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs text-gray-500">Fournisseur</label>
            <input name="fournisseur" value={form.fournisseur} onChange={handleChange}
                   placeholder="Ex.: SDE, Orange Money…"
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Référence facture</label>
            <input name="ref" value={form.ref} onChange={handleChange}
                   placeholder="ACH-2025-001"
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs text-gray-500">Montant HT</label>
            <input type="number" name="ht" value={form.ht} onChange={handleChange}
                   placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">TVA</label>
            <input type="number" name="tva" value={form.tva} onChange={handleChange}
                   placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs text-gray-500">Statut</label>
            <select name="statut" value={form.statut} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="en_attente">En attente</option>
              <option value="payee">Payée</option>
              <option value="partielle">Partiellement payée</option>
              <option value="en_retard">En retard</option>
              <option value="brouillon">Brouillon</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Mode de paiement</label>
            <select name="mode" value={form.mode} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="virement">Virement</option>
              <option value="espece">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="carte">Carte</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-500">Pièce jointe (facture/bon)</label>
            <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png,.webp"
                   onChange={handleChange} className="w-full text-sm" />
            <p className="text-xs text-gray-400 mt-1">
              Formats: PDF, JPG, PNG, WEBP
            </p>
          </div>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={save} className="px-3 py-2 text-sm rounded-lg bg-[#2e615e] text-white">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [supplier, setSupplier] = useState("all");
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [modalOpen, setModalOpen] = useState(false);

  // Données mock — remplace par ton API plus tard
  const [rows, setRows] = useState([
    { id: 1, date: "2025-08-01", fournisseur: "SENCOM SARL", ref: "ACH-2025-001", ht: 320000, tva: 57600, ttc: 377600, mode: "virement", echeance: "2025-08-15", statut: "payee", attachment: null },
    { id: 2, date: "2025-08-02", fournisseur: "Sonatel", ref: "ACH-2025-002", ht: 150000, tva: 27000, ttc: 177000, mode: "espece", echeance: "2025-08-12", statut: "en_attente", attachment: null },
    { id: 3, date: "2025-08-05", fournisseur: "Office Depot", ref: "ACH-2025-003", ht: 90000, tva: 16200, ttc: 106200, mode: "carte", echeance: "2025-08-20", statut: "partielle", attachment: null },
    { id: 4, date: "2025-08-06", fournisseur: "GA2C", ref: "ACH-2025-004", ht: 450000, tva: 81000, ttc: 531000, mode: "virement", echeance: "2025-08-10", statut: "en_retard", attachment: null },
  ]);

  const suppliersList = useMemo(
    () => Array.from(new Set(rows.map((r) => r.fournisseur))),
    [rows]
  );

  const filtered = rows.filter((r) => {
    const okStatus = status === "all" ? true : r.statut === status;
    const okSupplier = supplier === "all" ? true : r.fournisseur === supplier;
    const q = query.trim().toLowerCase();
    const okQ = !q || r.fournisseur.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q);
    const okFrom = !period.from || r.date >= period.from;
    const okTo = !period.to || r.date <= period.to;
    return okStatus && okSupplier && okQ && okFrom && okTo;
  });

  const totalHT = filtered.reduce((s, r) => s + r.ht, 0);
  const totalTVA = filtered.reduce((s, r) => s + r.tva, 0);
  const totalTTC = filtered.reduce((s, r) => s + r.ttc, 0);
  const aPayer = filtered
    .filter((r) => r.statut !== "payee")
    .reduce((s, r) => s + r.ttc, 0);

  const addRow = (p) => setRows((prev) => [p, ...prev]);

  return (
    <div className="min-h-full">
      {/* Header local */}
      <div className="flex justify-between items-center mb-6 bg-white px-4 py-2 rounded-lg shadow">
        <h1 className="text-xl font-semibold">Achats</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm rounded-lg border hover:bg-[#BFFFDF] hover:text-[#2e615e]">
            Exporter Excel
          </button>
          <button className="px-3 py-2 text-sm rounded-lg border hover:bg-[#BFFFDF] hover:text-[#2e615e]">
            Exporter PDF
          </button>
          <button
            className="px-3 py-2 text-sm rounded-lg bg-[#2e615e] text-white"
            onClick={() => setModalOpen(true)}
          >
            + Nouvel achat
          </button>
        </div>
      </div>

      {/* Résumés */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total achats (TTC)" value={`${totalTTC.toLocaleString()} FCFA`} hint="Période filtrée" icon="🧾" />
        <SummaryCard title="TVA déductible" value={`${totalTVA.toLocaleString()} FCFA`} icon="📉" />
        <SummaryCard title="Montant HT" value={`${totalHT.toLocaleString()} FCFA`} icon="📊" />
        <SummaryCard title="À payer" value={`${aPayer.toLocaleString()} FCFA`} icon="💸" />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="Rechercher fournisseur ou réf…"
          />
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Tous fournisseurs</option>
            {suppliersList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Tous statuts</option>
            <option value="payee">Payée</option>
            <option value="en_attente">En attente</option>
            <option value="partielle">Partiellement payée</option>
            <option value="en_retard">En retard</option>
            <option value="brouillon">Brouillon</option>
          </select>
          <input
            type="date"
            value={period.from}
            onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={period.to}
            onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#2e615e] text-white">
                <th className="px-3 py-2 text-left">N°</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Fournisseur</th>
                <th className="px-3 py-2 text-left">Référence</th>
                <th className="px-3 py-2 text-right">HT</th>
                <th className="px-3 py-2 text-right">TVA</th>
                <th className="px-3 py-2 text-right">TTC</th>
                <th className="px-3 py-2 text-left">Mode</th>
                <th className="px-3 py-2 text-left">Échéance</th>
                <th className="px-3 py-2 text-left">Statut</th>
                <th className="px-3 py-2 text-left">Justificatif</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-[#fff7e6]" : ""}>
                  <td className="px-3 py-2">{String(i + 1).padStart(3, "0")}</td>
                  <td className="px-3 py-2">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{r.fournisseur}</td>
                  <td className="px-3 py-2 font-medium">{r.ref}</td>
                  <td className="px-3 py-2 text-right">{r.ht.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{r.tva.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{r.ttc.toLocaleString()}</td>
                  <td className="px-3 py-2">{r.mode}</td>
                  <td className="px-3 py-2">{new Date(r.echeance).toLocaleDateString()}</td>
                  <td className="px-3 py-2"><Badge status={r.statut} /></td>
                  <td className="px-3 py-2">
                    {r.attachment ? (
                      <a
                        href={r.attachment.url}
                        download={r.attachment.name}
                        className="text-xs px-2 py-1 rounded-full border hover:bg-gray-50"
                        title={`Télécharger ${r.attachment.name}`}
                      >
                        📎 {r.attachment.name}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-[#BFFFDF]">Voir</button>
                      <button className="px-2 py-1 text-xs rounded border hover:bg-[#BFFFDF]">PDF</button>
                      <button className="px-2 py-1 text-xs rounded border hover:bg-[#BFFFDF]">Éditer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center text-gray-500 py-8">
                    Aucune donnée pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={4}>Totaux</td>
                <td className="px-3 py-2 text-right">{totalHT.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totalTVA.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totalTTC.toLocaleString()}</td>
                <td colSpan={5}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination simple */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-gray-600">{filtered.length} achats</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border hover:bg-gray-100" disabled>Préc.</button>
            <button className="px-3 py-1 rounded border hover:bg-gray-100" disabled>Suiv.</button>
          </div>
        </div>
      </div>

      {/* Modal d'ajout */}
      <AddPurchaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addRow}
      />
    </div>
  );
}
