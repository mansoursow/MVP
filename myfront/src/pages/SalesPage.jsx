// src/pages/SalesPage.jsx
import React, { useMemo, useState } from "react";
import InvoiceCreateModal from "./InvoiceCreateModal";

const STATUS_STYLES = {
  payee: "bg-green-100 text-green-700 border-green-300",
  en_retard: "bg-red-100 text-red-700 border-red-300",
  partielle: "bg-amber-100 text-amber-700 border-amber-300",
  brouillon: "bg-gray-100 text-gray-700 border-gray-300",
  envoyee: "bg-blue-100 text-blue-700 border-blue-300",
};

function Badge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.brouillon;
  const label =
    {
      payee: "Payée",
      en_retard: "En retard",
      partielle: "Partiellement payée",
      brouillon: "Brouillon",
      envoyee: "Envoyée",
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
      <div className="text-xl" aria-hidden>
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-600">{title}</div>
        <div className="text-2xl font-bold text-[#2e615e]">{value}</div>
        {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("factures"); // factures | devis | avoirs
  const [status, setStatus] = useState("all");

  // État d’ouverture de la modale de création
  const [openCreate, setOpenCreate] = useState(false);

  // Données mock (remplace par tes données API plus tard)
  const rows = useMemo(
    () => [
      {
        id: 1,
        date: "2025-08-01",
        client: "SENCOM SARL",
        ref: "FAC-2025-001",
        ht: 820000,
        tva: 147600,
        ttc: 967600,
        statut: "payee",
      },
      {
        id: 2,
        date: "2025-08-03",
        client: "Wari Services",
        ref: "FAC-2025-002",
        ht: 120000,
        tva: 21600,
        ttc: 141600,
        statut: "envoyee",
      },
      {
        id: 3,
        date: "2025-08-05",
        client: "NGO Santé+",
        ref: "FAC-2025-003",
        ht: 450000,
        tva: 81000,
        ttc: 531000,
        statut: "partielle",
      },
      {
        id: 4,
        date: "2025-08-07",
        client: "Sonatel",
        ref: "FAC-2025-004",
        ht: 990000,
        tva: 178200,
        ttc: 1168200,
        statut: "en_retard",
      },
      {
        id: 5,
        date: "2025-08-08",
        client: "GA2C",
        ref: "FAC-2025-005",
        ht: 200000,
        tva: 36000,
        ttc: 236000,
        statut: "brouillon",
      },
    ],
    []
  );

  const filtered = rows.filter((r) => {
    const okTab = tab === "factures"; // tu pourras splitter plus tard selon type
    const okStatus = status === "all" ? true : r.statut === status;
    const q = query.trim().toLowerCase();
    const okQ =
      !q || r.client.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q);
    return okTab && okStatus && okQ;
  });

  const totalHT = filtered.reduce((s, r) => s + r.ht, 0);
  const totalTVA = filtered.reduce((s, r) => s + r.tva, 0);
  const totalTTC = filtered.reduce((s, r) => s + r.ttc, 0);

  return (
    <div className="min-h-full">
      {/* Header local */}
      <div className="flex justify-between items-center mb-6 bg-white px-4 py-2 rounded-lg shadow">
        <h1 className="text-xl font-semibold">Ventes</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm rounded-lg border hover:bg-[#BFFFDF] hover:text-[#2e615e]">
            Exporter Excel
          </button>
          <button className="px-3 py-2 text-sm rounded-lg border hover:bg-[#BFFFDF] hover:text-[#2e615e]">
            Exporter PDF
          </button>
          <button
            className="px-3 py-2 text-sm rounded-lg bg-[#2e615e] text-white"
            onClick={() => setOpenCreate(true)}
          >
            + Nouvelle facture
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow p-2 mb-4">
        <div className="flex gap-2">
          {[
            { key: "factures", label: "Factures" },
            { key: "devis", label: "Devis" },
            { key: "avoirs", label: "Avoirs" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "px-4 py-2 text-sm rounded-full",
                tab === t.key ? "bg-[#BFFFDF] text-[#2e615e]" : "bg-gray-100 hover:bg-gray-200",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          title="Chiffre d’affaires (TTC)"
          value={`${totalTTC.toLocaleString()} FCFA`}
          hint="Période filtrée"
          icon="💰"
        />
        <SummaryCard
          title="TVA collectée"
          value={`${totalTVA.toLocaleString()} FCFA`}
          icon="🧾"
        />
        <SummaryCard title="Montant HT" value={`${totalHT.toLocaleString()} FCFA`} icon="📊" />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="Rechercher client ou réf…"
          />
          <select className="border rounded-lg px-3 py-2 text-sm" defaultValue="">
            <option value="">Tout client</option>
            <option>SENCOM SARL</option>
            <option>Wari Services</option>
            <option>NGO Santé+</option>
            <option>Sonatel</option>
            <option>GA2C</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Tous statuts</option>
            <option value="payee">Payée</option>
            <option value="envoyee">Envoyée</option>
            <option value="partielle">Partiellement payée</option>
            <option value="en_retard">En retard</option>
            <option value="brouillon">Brouillon</option>
          </select>
          <div className="flex gap-2">
            <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#2e615e] text-white">
                <th className="px-3 py-2 text-left">N°</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-left">Référence</th>
                <th className="px-3 py-2 text-right">HT</th>
                <th className="px-3 py-2 text-right">TVA</th>
                <th className="px-3 py-2 text-right">TTC</th>
                <th className="px-3 py-2 text-left">Statut</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-[#fff7e6]" : ""}>
                  <td className="px-3 py-2">{r.id.toString().padStart(3, "0")}</td>
                  <td className="px-3 py-2">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{r.client}</td>
                  <td className="px-3 py-2 font-medium">{r.ref}</td>
                  <td className="px-3 py-2 text-right">{r.ht.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{r.tva.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{r.ttc.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <Badge status={r.statut} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-[#BFFFDF]">
                        Voir
                      </button>
                      <button className="px-2 py-1 text-xs rounded border hover:bg-[#BFFFDF]">
                        PDF
                      </button>
                      <button className="px-2 py-1 text-xs rounded border hover:bg-[#BFFFDF]">
                        Éditer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 py-8">
                    Aucune donnée pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={4}>
                  Totaux
                </td>
                <td className="px-3 py-2 text-right">{totalHT.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totalTVA.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totalTTC.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination simple */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-gray-600">1–5 sur 5</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border hover:bg-gray-100" disabled>
              Préc.
            </button>
            <button className="px-3 py-1 rounded border hover:bg-gray-100" disabled>
              Suiv.
            </button>
          </div>
        </div>
      </div>

      {/* Modale de création de facture */}
      <InvoiceCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={(invoice) => {
          console.log("FACTURE CRÉÉE:", invoice);
          // TODO: envoyer au backend puis rafraîchir la liste (setRows(...))
          setOpenCreate(false);
        }}
        defaultClient=""
        nextRef={`FAC-${new Date().getFullYear()}-${String(1).padStart(3, "0")}`}
      />
    </div>
  );
}
