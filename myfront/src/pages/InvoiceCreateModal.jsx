// src/components/invoices/InvoiceCreateModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

function fmtFCFA(n) {
  if (Number.isNaN(n) || n == null) return "0 FCFA";
  return `${Math.round(n).toLocaleString()} FCFA`;
}

const DEFAULT_TVA = 18; // %
const emptyLine = () => ({
  id: crypto.randomUUID(),
  designation: "",
  qty: 1,
  unitPrice: 0,
  tva: DEFAULT_TVA, // % par ligne (modifiable)
});

export default function InvoiceCreateModal({
  open,
  onClose,
  onCreate, // (invoice) => void   <-- renvoie l'objet facture
  defaultClient = "",
  nextRef = "FAC-" + new Date().getFullYear() + "-001", // à adapter à ton backend
}) {
  const [ref, setRef] = useState(nextRef);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [client, setClient] = useState(defaultClient);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [logoUrl, setLogoUrl] = useState(""); // optionnel pour afficher un logo
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      // reset (tu peux retirer si tu veux garder l’état entre ouvertures)
      setRef(nextRef);
      setDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setClient(defaultClient);
      setNotes("");
      setLines([emptyLine()]);
    }
  }, [open, nextRef, defaultClient]);

  // Totaux
  const totals = useMemo(() => {
    const totalHT = lines.reduce(
      (s, l) => s + Number(l.qty || 0) * Number(l.unitPrice || 0),
      0
    );
    const totalTVA = lines.reduce((s, l) => {
      const ht = Number(l.qty || 0) * Number(l.unitPrice || 0);
      const rate = Number(l.tva || 0) / 100;
      return s + ht * rate;
    }, 0);
    const totalTTC = totalHT + totalTVA;
    return { totalHT, totalTVA, totalTTC };
  }, [lines]);

  const addLine = () => setLines((ls) => [...ls, emptyLine()]);
  const removeLine = (id) => setLines((ls) => ls.filter((l) => l.id !== id));
  const patchLine = (id, patch) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const handleSave = () => {
    // Validation minimale
    if (!client.trim()) {
      alert("Merci de renseigner le client.");
      return;
    }
    if (lines.length === 0 || lines.every((l) => !l.designation.trim())) {
      alert("Ajoute au moins une ligne avec une désignation.");
      return;
    }

    const payload = {
      ref,
      date,
      dueDate,
      client,
      notes,
      logoUrl,
      currency: "FCFA",
      items: lines.map((l) => ({
        designation: l.designation.trim(),
        qty: Number(l.qty || 0),
        unitPrice: Number(l.unitPrice || 0),
        tva: Number(l.tva || 0),
        totalHT: Number(l.qty || 0) * Number(l.unitPrice || 0),
      })),
      totals,
      status: "brouillon",
    };

    onCreate?.(payload);
  };

  const handlePreview = () => {
    // Simple prévisualisation : tu pourras remplacer par une vraie page/pdf
    console.table(lines);
    alert(
      `Aperçu\n\n${ref}\nClient: ${client}\nHT: ${fmtFCFA(
        totals.totalHT
      )}\nTVA: ${fmtFCFA(totals.totalTVA)}\nTTC: ${fmtFCFA(
        totals.totalTTC
      )}\n\n(Implémente un PDF plus tard)`
    );
  };

  // Fermer au clic fond ou ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={(e) => {
          // fermer seulement si on clique le fond
          if (e.target === e.currentTarget) onClose?.();
        }}
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        className="relative bg-white w-[min(1100px,94vw)] max-h-[92vh] rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                alt="logo"
                src={logoUrl}
                className="h-8 w-8 rounded object-contain"
              />
            ) : (
              <div className="h-8 w-8 rounded bg-[#ffe7c2] grid place-items-center text-xs">
                LOGO
              </div>
            )}
            <h2 className="text-lg font-semibold">Nouvelle facture</h2>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-gray-100"
            aria-label="Fermer"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Body scrollable */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-140px)]">
          {/* En-tête facture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="block text-xs text-gray-600">Référence</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />

              <label className="block text-xs text-gray-600 mt-3">
                Date de facture
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <label className="block text-xs text-gray-600 mt-3">
                Échéance
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-gray-600">Client</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Nom de l’entreprise du client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />

              <label className="block text-xs text-gray-600 mt-3">
                URL du logo (optionnel)
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="https://…"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Ligne d’ajout rapide */}
          <div className="mb-3 text-sm font-medium text-gray-700">
            Lignes de facture
          </div>
          <div className="grid grid-cols-12 gap-2 items-end mb-3">
            <div className="col-span-4">
              <label className="block text-xs text-gray-600">Désignation</label>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600">Quantité</label>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600">
                Prix unitaire
              </label>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600">TVA (%)</label>
            </div>
            <div className="col-span-2" />
          </div>

          {lines.map((l, idx) => {
            const ht = Number(l.qty || 0) * Number(l.unitPrice || 0);
            const tvaVal = ht * (Number(l.tva || 0) / 100);
            const ttc = ht + tvaVal;
            return (
              <div
                key={l.id}
                className={`grid grid-cols-12 gap-2 items-center py-2 px-2 rounded-lg ${
                  idx % 2 ? "bg-[#fff7e6]" : "bg-white"
                } border`}
              >
                <input
                  className="col-span-4 border rounded-lg px-3 py-2 text-sm"
                  placeholder="Description"
                  value={l.designation}
                  onChange={(e) =>
                    patchLine(l.id, { designation: e.target.value })
                  }
                />
                <input
                  type="number"
                  min="0"
                  className="col-span-2 border rounded-lg px-3 py-2 text-sm"
                  value={l.qty}
                  onChange={(e) =>
                    patchLine(l.id, { qty: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min="0"
                  className="col-span-2 border rounded-lg px-3 py-2 text-sm"
                  value={l.unitPrice}
                  onChange={(e) =>
                    patchLine(l.id, { unitPrice: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min="0"
                  className="col-span-2 border rounded-lg px-3 py-2 text-sm"
                  value={l.tva}
                  onChange={(e) =>
                    patchLine(l.id, { tva: Number(e.target.value) })
                  }
                />

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="text-xs text-gray-500">{fmtFCFA(ttc)}</span>
                  <button
                    className="h-8 px-3 rounded border hover:bg-[#BFFFDF] text-xs"
                    onClick={addLine}
                    title="Ajouter une ligne"
                    type="button"
                  >
                    +
                  </button>
                  <button
                    className="h-8 px-3 rounded border hover:bg-red-50 text-xs"
                    onClick={() => removeLine(l.id)}
                    title="Supprimer la ligne"
                    type="button"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}

          {/* Notes + Totaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                className="w-full min-h-24 border rounded-lg px-3 py-2 text-sm"
                placeholder="Conditions de paiement, mentions légales, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-xl border p-4 h-fit">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium">{fmtFCFA(totals.totalHT)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">TVA</span>
                <span className="font-medium">{fmtFCFA(totals.totalTVA)}</span>
              </div>
              <div className="flex justify-between text-base mt-2 border-t pt-2">
                <span className="font-semibold">Total TTC</span>
                <span className="font-bold text-[#2e615e]">
                  {fmtFCFA(totals.totalTTC)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            className="px-4 py-2 rounded-lg border hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="px-4 py-2 rounded-lg border hover:bg-[#BFFFDF] hover:text-[#2e615e]"
            onClick={handlePreview}
            type="button"
          >
            Aperçu
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#2e615e] text-white hover:opacity-90"
            onClick={handleSave}
            type="button"
          >
            Enregistrer le brouillon
          </button>
        </div>
      </div>
    </div>
  );
}
