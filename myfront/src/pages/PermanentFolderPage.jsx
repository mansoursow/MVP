// src/pages/PermanentFolderPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OcrModal from "../components/ocr/OcrModal"; // ✅ NEW (ajuste le chemin si différent)

const COLORS = {
  primary: "#2e615e",
  mint: "#BFFFDF",
};

const TYPES = [
  { value: "ninea", label: "NINEA" },
  { value: "rccm", label: "RCCM" },
  { value: "statuts", label: "Statuts" },
  { value: "contrat", label: "Contrat" },
  { value: "autre", label: "Autre" },
];

function TypeBadge({ type }) {
  const map = {
    ninea: "bg-emerald-100 text-emerald-700 border-emerald-300",
    rccm: "bg-cyan-100 text-cyan-700 border-cyan-300",
    statuts: "bg-indigo-100 text-indigo-700 border-indigo-300",
    contrat: "bg-amber-100 text-amber-700 border-amber-300",
    autre: "bg-gray-100 text-gray-700 border-gray-300",
  };
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded-full border ${map[type] || map.autre}`}>
      {TYPES.find(t => t.value === type)?.label || "Autre"}
    </span>
  );
}

function UploadArea({ onFiles }) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={[
        "border-2 border-dashed rounded-xl p-10 text-center transition",
        isOver ? "bg-[#BFFFDF]/40 border-[#BFFFDF]" : "bg-white border-gray-200",
      ].join(" ")}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-5xl">📄</div>
        <p className="text-gray-700 font-medium">Téléverser un document</p>
        <p className="text-sm text-gray-500">
          Glissez-déposez un fichier (PDF, JPG, PNG, WEBP) ou
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 rounded-full border"
          style={{ borderColor: COLORS.primary }}
        >
          Importer
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(e) => onFiles(Array.from(e.target.files || []))}
        />
      </div>
    </div>
  );
}

function DocumentCard({ doc, onRename, onDelete }) {
  const isImage = /image/i.test(doc.type);
  const isPdf = /pdf/i.test(doc.type);

  // ✅ NEW: état d’ouverture du modal OCR
  const [ocrOpen, setOcrOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow p-4 flex gap-4 items-start">
      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
        {isImage ? (
          <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">📄</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-[#2e615e] truncate">{doc.name}</h4>
          <TypeBadge type={doc.typeKey || "autre"} />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {new Date(doc.createdAt).toLocaleString()} • {(doc.size / 1024).toFixed(1)} Ko
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 text-xs rounded border hover:bg-gray-50"
          >
            {isPdf ? "Ouvrir le PDF" : "Prévisualiser"}
          </a>
          <a
            href={doc.url}
            download={doc.originalName}
            className="px-3 py-1 text-xs rounded border hover:bg-gray-50"
          >
            Télécharger
          </a>

          {/* ✅ NEW: bouton OCR (actif si on a le File original) */}
          <button
            onClick={() => setOcrOpen(true)}
            className={`px-3 py-1 text-xs rounded border ${
              doc._originalFile ? "hover:bg-[#BFFFDF]" : "opacity-50 cursor-not-allowed"
            }`}
            title={doc._originalFile ? "Reconnaissance de texte (OCR)" : "OCR dispo pour les fichiers nouvellement ajoutés"}
            disabled={!doc._originalFile}
          >
            OCR
          </button>

          <button
            onClick={() => {
              const newName = prompt("Nouveau nom du document :", doc.name);
              if (newName) onRename(doc.id, newName);
            }}
            className="px-3 py-1 text-xs rounded border hover:bg-gray-50"
          >
            Renommer
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="px-3 py-1 text-xs rounded border hover:bg-red-50 text-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* ✅ NEW: Modal OCR — on passe le file original attendu par TON OcrModal */}
      <OcrModal
        open={ocrOpen}
        file={doc._originalFile || null}
        onClose={() => setOcrOpen(false)}
      />
    </div>
  );
}

export default function PermanentFolderPage() {
  const [docs, setDocs] = useState([]);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("autre");
  const [query, setQuery] = useState("all");
  const [search, setSearch] = useState("");

  // Charger depuis localStorage
  useEffect(() => {
    const raw = localStorage.getItem("permanent_docs_v1");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setDocs(parsed);
      } catch {}
    }
  }, []);

  // Sauvegarder (on n’enregistre PAS _originalFile, car non sérialisable)
  useEffect(() => {
    const toPersist = docs.map(({ _originalFile, ...rest }) => rest);
    localStorage.setItem("permanent_docs_v1", JSON.stringify(toPersist));
  }, [docs]);

  const onFiles = useCallback(
    (files) => {
      const toAdd = files.map((f) => ({
        id: Date.now() + Math.random(),
        name: docName?.trim() || f.name,
        originalName: f.name,
        size: f.size,
        type: f.type,
        typeKey: docType,
        url: URL.createObjectURL(f), // preview (remplacée + tard par URL backend)
        createdAt: new Date().toISOString(),
        _originalFile: f,           // ✅ NEW : garde le File pour OCR immédiat
      }));
      setDocs((prev) => [...toAdd, ...prev]);
      setDocName("");
      setDocType("autre");
    },
    [docName, docType]
  );

  const renameDoc = (id, name) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
  };

  const deleteDoc = (id) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const filtered = useMemo(() => {
    const byType = query === "all" ? docs : docs.filter((d) => d.typeKey === query);
    const q = search.trim().toLowerCase();
    return q
      ? byType.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.originalName.toLowerCase().includes(q)
        )
      : byType;
  }, [docs, query, search]);

  return (
    <div className="min-h-full">
      {/* Header local */}
      <div className="flex justify-between items-center mb-6 bg-white px-4 py-2 rounded-lg shadow">
        <h1 className="text-xl font-semibold">Dossier permanent</h1>
        <div className="text-sm text-gray-500">
          Centralisez et sécurisez les documents clés (RCCM, NINEA, statuts, contrats…)
        </div>
      </div>

      {/* Bloc upload */}
      <div className="bg-[#7ea6a6] rounded-xl p-6 mb-6">
        <div className="bg-white rounded-xl p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Documents</h3>

          <UploadArea onFiles={onFiles} />

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm flex-1"
              placeholder="Nom du document"
            />
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                document.querySelector('input[type="file"]')?.click();
              }}
              className="px-4 py-2 rounded-full text-sm text-white"
              style={{ backgroundColor: COLORS.primary }}
            >
              Valider
            </button>
          </div>
        </div>
      </div>

      {/* Filtres & recherche */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setQuery("all")}
              className={[
                "px-3 py-2 text-sm rounded-full border",
                query === "all"
                  ? "bg-[#BFFFDF] text-[#2e615e]"
                  : "bg-white hover:bg-gray-50",
              ].join(" ")}
            >
              Tous
            </button>
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setQuery(t.value)}
                className={[
                  "px-3 py-2 text-sm rounded-full border",
                  query === t.value
                    ? "bg-[#BFFFDF] text-[#2e615e]"
                    : "bg-white hover:bg-gray-50",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="md:ml-auto flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un document…"
              className="border rounded-lg px-3 py-2 text-sm w-64"
            />
            <button
              onClick={() => setSearch("")}
              className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
            >
              Effacer
            </button>
          </div>
        </div>
      </div>

      {/* Liste des documents */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 bg-white rounded-xl p-8">
            Aucun document pour ces filtres.
          </div>
        ) : (
          filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onRename={renameDoc}
              onDelete={deleteDoc}
            />
          ))
        )}
      </div>
    </div>
  );
}
