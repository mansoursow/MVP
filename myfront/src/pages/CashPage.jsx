// src/pages/CashPage.jsx
import React, { useMemo, useState } from "react";

function SummaryTile({ label, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-bold text-[#2e615e] mt-1">{value}</div>
    </div>
  );
}

function AddEntryModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    libelle: "",
    type: "encaissement", // encaissement | decaissement
    montant: "",
    invoiceRef: "", // référence de facture liée
    file: null, // fichier justificatif
  });

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      const file = files?.[0] || null;
      setForm((f) => ({ ...f, file }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const save = () => {
    const m = parseFloat(form.montant || "0");
    if (!form.libelle || !m) return;
    const payload = {
      id: Date.now(),
      date: form.date,
      libelle: form.libelle,
      encaissement: form.type === "encaissement" ? m : 0,
      decaissement: form.type === "decaissement" ? m : 0,
      invoiceRef: form.invoiceRef?.trim() || "",
      attachment: form.file
        ? {
            name: form.file.name,
            url: URL.createObjectURL(form.file), // preview/telechargement local
            size: form.file.size,
            type: form.file.type,
          }
        : null,
    };
    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Nouvelle opération de caisse</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="encaissement">Encaissement</option>
                <option value="decaissement">Décaissement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Libellé</label>
            <input
              name="libelle"
              value={form.libelle}
              onChange={handleChange}
              placeholder="Ex.: Vente comptant, Achat fournitures…"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Montant (FCFA)</label>
            <input
              type="number"
              name="montant"
              value={form.montant}
              onChange={handleChange}
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs text-gray-500">
                Facture liée (réf.)
              </label>
              <input
                name="invoiceRef"
                value={form.invoiceRef}
                onChange={handleChange}
                placeholder="FAC-2025-001 (optionnel)"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">
                Pièce jointe (bon de caisse)
              </label>
              <input
                type="file"
                name="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleChange}
                className="w-full text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Formats acceptés: PDF, JPG, PNG, WEBP
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={save}
            className="px-3 py-2 text-sm rounded-lg bg-[#2e615e] text-white"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CashPage() {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [modalOpen, setModalOpen] = useState(false);

  // Données mock — remplace par ton API plus tard
  const [rows, setRows] = useState([
    {
      id: 1,
      date: "2025-08-01",
      libelle: "Vente comptant",
      encaissement: 250000,
      decaissement: 0,
      invoiceRef: "FAC-2025-001",
      attachment: null,
    },
    {
      id: 2,
      date: "2025-08-02",
      libelle: "Achat fournitures",
      encaissement: 0,
      decaissement: 35000,
      invoiceRef: "FAC-2025-112",
      attachment: null,
    },
    {
      id: 3,
      date: "2025-08-03",
      libelle: "Règlement client",
      encaissement: 120000,
      decaissement: 0,
      invoiceRef: "",
      attachment: null,
    },
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const okQ =
        !q ||
        r.libelle.toLowerCase().includes(q) ||
        r.invoiceRef?.toLowerCase().includes(q);
      const okFrom = !period.from || r.date >= period.from;
      const okTo = !period.to || r.date <= period.to;
      return okQ && okFrom && okTo;
    });
  }, [rows, query, period]);

  const totals = filtered.reduce(
    (acc, r) => {
      acc.encaissements += r.encaissement;
      acc.decaissements += r.decaissement;
      acc.solde += r.encaissement - r.decaissement;
      return acc;
    },
    { encaissements: 0, decaissements: 0, solde: 0 }
  );

  const addRow = (op) => setRows((prev) => [op, ...prev]);

  return (
    <div className="min-h-full">
      {/* Header local */}
      <div className="flex justify-between items-center mb-6 bg-white px-4 py-2 rounded-lg shadow">
        <h1 className="text-xl font-semibold">Caisse</h1>
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
            + Ajouter
          </button>
        </div>
      </div>

      {/* Résumés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryTile
          label="Total encaissements"
          value={`${totals.encaissements.toLocaleString()} FCFA`}
        />
        <SummaryTile
          label="Total décaissements"
          value={`${totals.decaissements.toLocaleString()} FCFA`}
        />
        <SummaryTile
          label="Solde période"
          value={`${totals.solde.toLocaleString()} FCFA`}
        />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="Rechercher libellé ou réf. facture…"
          />
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
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
              onClick={() => {
                setQuery("");
                setPeriod({ from: "", to: "" });
              }}
            >
              Réinitialiser
            </button>
          </div>
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
                <th className="px-3 py-2 text-left">Libellé</th>
                <th className="px-3 py-2 text-right">Encaissements</th>
                <th className="px-3 py-2 text-right">Décaissements</th>
                <th className="px-3 py-2 text-right">Solde cumulé</th>
                <th className="px-3 py-2 text-left">Justificatif</th>{" "}
                {/* 👈 nouvelle colonne */}
              </tr>
            </thead>
            <tbody>
              {
                filtered.reduce(
                  (acc, r, i) => {
                    const prevSolde = acc.prevSolde ?? 0;
                    const soldeCumule =
                      prevSolde + r.encaissement - r.decaissement;
                    acc.prevSolde = soldeCumule;

                    acc.rows.push(
                      <tr key={r.id} className={i % 2 ? "bg-[#fff7e6]" : ""}>
                        <td className="px-3 py-2">
                          {String(i + 1).padStart(3, "0")}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(r.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">{r.libelle}</td>
                        <td className="px-3 py-2 text-right">
                          {r.encaissement
                            ? r.encaissement.toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.decaissement
                            ? r.decaissement.toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {soldeCumule.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {r.invoiceRef ? (
                              <span className="inline-block text-xs px-2 py-1 rounded-full border bg-[#BFFFDF] text-[#2e615e]">
                                {r.invoiceRef}
                              </span>
                            ) : null}
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
                          </div>
                        </td>
                      </tr>
                    );
                    return acc;
                  },
                  { prevSolde: 0, rows: [] }
                ).rows
              }
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={3}>
                  Totaux
                </td>
                <td className="px-3 py-2 text-right">
                  {totals.encaissements.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  {totals.decaissements.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  {totals.solde.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination simple */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-gray-600">{filtered.length} opérations</span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border hover:bg-gray-100"
              disabled
            >
              Préc.
            </button>
            <button
              className="px-3 py-1 rounded border hover:bg-gray-100"
              disabled
            >
              Suiv.
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'ajout */}
      <AddEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addRow}
      />
    </div>
  );
}
