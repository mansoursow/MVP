// src/pages/BankPage.jsx
import React, { useMemo, useState } from "react";

/** Petits composants réutilisables **/
function SummaryTile({ label, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-bold text-[#2e615e] mt-1">{value}</div>
    </div>
  );
}

function StatusPill({ ok }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border",
        ok
          ? "bg-green-100 text-green-700 border-green-300"
          : "bg-amber-100 text-amber-700 border-amber-300",
      ].join(" ")}
    >
      {ok ? "Rapproché" : "À rapprocher"}
    </span>
  );
}

/** Modal d'ajout manuel d'opération bancaire **/
function AddTxnModal({ open, onClose, onSave, accountId }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    libelle: "",
    type: "credit", // credit = entrée (positif), debit = sortie (négatif)
    montant: "",
    ref: "",
    rapproche: false,
    attachment: null,
  });

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "attachment") {
      const file = files?.[0] || null;
      setForm((f) => ({ ...f, attachment: file }));
    } else if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const save = () => {
    const amount = parseFloat(form.montant || "0");
    if (!form.libelle || !amount) return;
    onSave({
      id: Date.now(),
      accountId,
      date: form.date,
      libelle: form.libelle,
      credit: form.type === "credit" ? amount : 0,
      debit: form.type === "debit" ? amount : 0,
      ref: form.ref,
      rapproche: form.rapproche,
      attachment: form.attachment
        ? {
            name: form.attachment.name,
            url: URL.createObjectURL(form.attachment),
            size: form.attachment.size,
            type: form.attachment.type,
          }
        : null,
      source: "manuel",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Nouvelle opération bancaire</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange}
                     className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <select name="type" value={form.type} onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="credit">Crédit (entrée)</option>
                <option value="debit">Débit (sortie)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Libellé</label>
            <input name="libelle" value={form.libelle} onChange={handleChange}
                   placeholder="Virement client, Frais bancaires…"
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Montant (FCFA)</label>
              <input type="number" name="montant" value={form.montant} onChange={handleChange}
                     placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Référence (facultatif)</label>
              <input name="ref" value={form.ref} onChange={handleChange}
                     placeholder="REF-123"
                     className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input id="rapproche" name="rapproche" type="checkbox"
                   checked={form.rapproche} onChange={handleChange} />
            <label htmlFor="rapproche" className="text-sm text-gray-700">Marquer comme rapproché</label>
          </div>

          <div>
            <label className="text-xs text-gray-500">Pièce jointe (relevé/justif.)</label>
            <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png,.webp"
                   onChange={handleChange} className="w-full text-sm" />
          </div>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50">Annuler</button>
          <button onClick={save} className="px-3 py-2 text-sm rounded-lg bg-[#2e615e] text-white">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

/** Import basique de CSV (séparateur ; ou ,) : colonnes attendues -> date,libelle,debit,credit,ref **/
function ImportCsvModal({ open, onClose, onImport, accountId }) {
  const [file, setFile] = useState(null);
  if (!open) return null;

  const parseCsv = (text) => {
    const lines = text.trim().split(/\r?\n/);
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw) continue;
      const cells = raw.split(/;|,/).map((c) => c.trim());
      if (i === 0 && /date/i.test(cells[0]) && /libell/i.test(cells[1])) {
        // ligne d'entête -> skip
        continue;
      }
      const [date, libelle, debitStr, creditStr, ref] = cells;
      const debit = parseFloat((debitStr || "0").replace(/\s/g, "").replace(",", "."));
      const credit = parseFloat((creditStr || "0").replace(/\s/g, "").replace(",", "."));
      if (!date || !libelle || (!debit && !credit)) continue;
      out.push({
        id: Date.now() + i,
        accountId,
        date,
        libelle,
        debit: isNaN(debit) ? 0 : debit,
        credit: isNaN(credit) ? 0 : credit,
        ref: ref || "",
        rapproche: false,
        attachment: null,
        source: "import",
      });
    }
    return out;
  };

  const handleImport = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result || "";
      const rows = parseCsv(text);
      onImport(rows);
      onClose();
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Importer un relevé (CSV)</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          <p className="text-xs text-gray-500">
            Colonnes attendues : <code>date;libelle;debit;credit;ref</code> (séparateur « ; » ou « , »).
          </p>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50">Annuler</button>
          <button onClick={handleImport} className="px-3 py-2 text-sm rounded-lg bg-[#2e615e] text-white">
            Importer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BankPage() {
  /** Comptes bancaires **/
  const [accounts] = useState([
    { id: "bcnk-001", name: "BICIS - Compte courant", iban: "SN123...", soldeInitial: 1_250_000 },
    { id: "bcnk-002", name: "BOA - Compte pro", iban: "SN456...", soldeInitial: 350_000 },
  ]);
  const [currentAccount, setCurrentAccount] = useState(accounts[0].id);

  /** Filtres & états UI **/
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [rapproStatus, setRapproStatus] = useState("all"); // all | ok | todo
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  /** Données (mock) **/
  const [rows, setRows] = useState([
    { id: 1, accountId: "bcnk-001", date: "2025-08-01", libelle: "Virement client", credit: 420000, debit: 0, ref: "VIR-784", rapproche: true, attachment: null, source: "import" },
    { id: 2, accountId: "bcnk-001", date: "2025-08-02", libelle: "Frais bancaires", credit: 0, debit: 3500, ref: "FRAIS-08", rapproche: true, attachment: null, source: "import" },
    { id: 3, accountId: "bcnk-001", date: "2025-08-03", libelle: "Achat fournitures", credit: 0, debit: 45000, ref: "ACH-552", rapproche: false, attachment: null, source: "manuel" },
    { id: 4, accountId: "bcnk-002", date: "2025-08-04", libelle: "Règlement client", credit: 150000, debit: 0, ref: "REG-221", rapproche: false, attachment: null, source: "import" },
  ]);

  /** Sélection / filtrage par compte **/
  const account = accounts.find(a => a.id === currentAccount);
  const byAccount = rows.filter(r => r.accountId === currentAccount);

  /** Filtre global **/
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return byAccount.filter((r) => {
      const okQ =
        !q ||
        r.libelle.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q);
      const okFrom = !period.from || r.date >= period.from;
      const okTo = !period.to || r.date <= period.to;
      const okRappro =
        rapproStatus === "all"
          ? true
          : rapproStatus === "ok"
          ? r.rapproche
          : !r.rapproche;
      return okQ && okFrom && okTo && okRappro;
    });
  }, [byAccount, query, period, rapproStatus]);

  /** Calculs de synthèse **/
  const totals = filtered.reduce(
    (acc, r) => {
      acc.in += r.credit;
      acc.out += r.debit;
      return acc;
    },
    { in: 0, out: 0 }
  );

  /** Solde courant (solde initial + tous mouvements du compte) **/
  const soldeCourant = useMemo(() => {
    const all = rows.filter(r => r.accountId === currentAccount);
    const t = all.reduce((s, r) => s + r.credit - r.debit, 0);
    return (account?.soldeInitial || 0) + t;
  }, [rows, currentAccount, account]);

  /** Ajout / Import **/
  const addTxn = (op) => setRows((prev) => [op, ...prev]);
  const importTxns = (list) => setRows((prev) => [...list, ...prev]);

  return (
    <div className="min-h-full">
      {/* Header local */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 bg-white px-4 py-2 rounded-lg shadow">
        <h1 className="text-xl font-semibold">Banque</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={currentAccount}
            onChange={(e) => setCurrentAccount(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button className="px-3 py-2 text-sm rounded-lg border hover:bg-[#BFFFDF] hover:text-[#2e615e]"
                  onClick={() => setImportOpen(true)}>
            Import CSV
          </button>
          <button className="px-3 py-2 text-sm rounded-lg bg-[#2e615e] text-white"
                  onClick={() => setAddOpen(true)}>
            + Nouvelle opération
          </button>
        </div>
      </div>

      {/* Résumés */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryTile label="Solde du compte" value={`${soldeCourant.toLocaleString()} FCFA`} />
        <SummaryTile label="Crédits (période filtrée)" value={`${totals.in.toLocaleString()} FCFA`} />
        <SummaryTile label="Débits (période filtrée)" value={`${totals.out.toLocaleString()} FCFA`} />
        <SummaryTile
          label="Variation filtrée"
          value={`${(totals.in - totals.out).toLocaleString()} FCFA`}
        />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="Rechercher libellé ou réf…"
          />
          <select
            value={rapproStatus}
            onChange={(e) => setRapproStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Tous états</option>
            <option value="ok">Rapprochés</option>
            <option value="todo">À rapprocher</option>
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
          <button
            className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
            onClick={() => {
              setQuery("");
              setPeriod({ from: "", to: "" });
              setRapproStatus("all");
            }}
          >
            Réinitialiser
          </button>
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
                <th className="px-3 py-2 text-right">Débit</th>
                <th className="px-3 py-2 text-right">Crédit</th>
                <th className="px-3 py-2 text-right">Solde cumulé</th>
                <th className="px-3 py-2 text-left">Réf</th>
                <th className="px-3 py-2 text-left">État</th>
                <th className="px-3 py-2 text-left">Justificatif</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.reduce((acc, r, i) => {
                const prev = acc.prev ?? (account?.soldeInitial || 0);
                const solde = prev + r.credit - r.debit;
                acc.prev = solde;
                acc.rows.push(
                  <tr key={r.id} className={i % 2 ? "bg-[#fff7e6]" : ""}>
                    <td className="px-3 py-2">{String(i + 1).padStart(3, "0")}</td>
                    <td className="px-3 py-2">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{r.libelle}</td>
                    <td className="px-3 py-2 text-right">{r.debit ? r.debit.toLocaleString() : "-"}</td>
                    <td className="px-3 py-2 text-right">{r.credit ? r.credit.toLocaleString() : "-"}</td>
                    <td className="px-3 py-2 text-right">{solde.toLocaleString()}</td>
                    <td className="px-3 py-2">{r.ref || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-2"><StatusPill ok={r.rapproche} /></td>
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
                        <button
                          className="px-2 py-1 text-xs rounded border hover:bg-[#BFFFDF]"
                          onClick={() =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, rapproche: !x.rapproche } : x
                              )
                            )
                          }
                        >
                          {r.rapproche ? "Démarquer" : "Rapprocher"}
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded border hover:bg-[#BFFFDF]"
                          onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                return acc;
              }, { prev: undefined, rows: [] }).rows}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-gray-500 py-8">
                    Aucune opération pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={3}>Totaux (période filtrée)</td>
                <td className="px-3 py-2 text-right">
                  {totals.out.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  {totals.in.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  {(account?.soldeInitial || 0) + (totals.in - totals.out) /* affichage local */ }
                </td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination simple */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-gray-600">{filtered.length} opérations</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border hover:bg-gray-100" disabled>Préc.</button>
            <button className="px-3 py-1 rounded border hover:bg-gray-100" disabled>Suiv.</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTxnModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={addTxn}
        accountId={currentAccount}
      />
      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={importTxns}
        accountId={currentAccount}
      />
    </div>
  );
}
