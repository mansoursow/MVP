import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

// Config worker PDF.js
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Helpers
function cleanMoneyToken(s) {
  return (s || "").toString().replace(/[^\d.,]/g, "").replace(/\s/g, "");
}
function parseMoneyFCFA(s) {
  if (!s) return NaN;
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? NaN : n;
}

// Fournisseur
function guessSupplier(text, fallbackFilename = "") {
  // site / email
  const site =
    text.match(/https?:\/\/([a-z0-9.-]+)/i)?.[1] ||
    text.match(/\b([a-z0-9.-]+\.[a-z]{2,})\b/i)?.[1];
  if (site) {
    const host = site.toLowerCase().replace(/^www\./, "").replace(/\.[a-z.]+$/, "");
    if (host && host.length >= 3 && !/gmail|yahoo|outlook|hotmail/i.test(host)) {
      return host.replace(/[-_.]+/g, " ").toUpperCase();
    }
  }
  // nom fichier
  if (fallbackFilename) {
    const base = fallbackFilename.replace(/\.[^.]+$/i, "");
    const cleaned = base
      .replace(/facture|invoice|bon|note|debit|credit/gi, "")
      .replace(/\(.*?\)/g, "")
      .replace(/[_-]+/g, " ")
      .trim();
    if (cleaned && cleaned.split(/\s+/).length >= 2) return cleaned.toUpperCase();
  }
  // heuristique sur texte
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const orgWords = /(SARL|SA|SAS|SNC|EURL|SASU|GIE|LTD|INC|CORP|SONATEL|ORANGE|SDE|WARI|GA2C|SENCOM|FREE|EXPRESSO|DK\s*TUNING)/i;
  for (const l of lines.slice(0, 15)) {
    if (orgWords.test(l)) return l.replace(/\s{2,}/g, " ").trim();
    if (/^[A-Z0-9 .,'&-]{6,}$/.test(l) && !/facture|invoice|bon|devis|reçu|receipt/i.test(l)) {
      return l.replace(/\s{2,}/g, " ").trim();
    }
  }
  return "";
}

// Extraction principale
function extractFields(text, filename = "") {
  const out = { fournisseur: "", ref: "", ht: "", tva: "", ttc: "" };

  // Fournisseur
  out.fournisseur = guessSupplier(text, filename);

  // Référence facture
  const refFromNumero = text.match(/FACTURE\s*(?:N[°ºo]|No?)\s*[:#-]?\s*([A-Z0-9\-\/]+)/i)?.[1];
  const refFromCode = text.match(/\b(?:ACH|FAC|FACT)\s*[-:/#]?\s*[A-Z]*\s*[-/]?\s*\d{3,}\b/i)?.[0];
  if (refFromNumero) out.ref = `FAC-${refFromNumero}`.toUpperCase();
  else if (refFromCode) out.ref = refFromCode.toUpperCase();

  // TTC
  const ttcRaw =
    text.match(/(?:TOTAL\s+TTC|TTC|T\.?T\.?C\.?|Net\s+(?:à\s+)?payer|Total\s*(?:à\s*)?payer)[^\d%]{0,40}([\d\s.,\u00A0]+)\s*(?:FCFA|CFA)?/i)?.[1] || "";
  const ttc = parseMoneyFCFA(cleanMoneyToken(ttcRaw));
  if (!Number.isNaN(ttc)) out.ttc = String(ttc);

  // HT
  const htRaw =
    text.match(/Hors\s*Taxes?.{0,30}?([\d\s.,\u00A0]+)\s*(?:FCFA|CFA)?/i)?.[1] ||
    text.match(/([\d\s.,\u00A0]{3,})\s*(?:FCFA|CFA)\s*(?:H\.?T\.?|HT)/i)?.[1] || "";
  const ht = parseMoneyFCFA(cleanMoneyToken(htRaw));

  // TVA
  const tvaAmountRaw = text.match(/TVA(?!\s*incluse)[^\d%]{0,30}([\d\s.,\u00A0]+)\s*(?:FCFA|CFA)?/i)?.[1] || "";
  const tvaAmount = parseMoneyFCFA(cleanMoneyToken(tvaAmountRaw));
  const tvaRateRaw = text.match(/TVA[^\d%]{0,10}(\d{1,2}(?:[.,]\d)?)\s*%/i)?.[1] || "";
  const tvaRate = tvaRateRaw ? parseFloat(tvaRateRaw.replace(",", ".")) : NaN;

  let finalHT = !Number.isNaN(ht) ? ht : NaN;
  let finalTVA = !Number.isNaN(tvaAmount) ? tvaAmount : NaN;

  if (Number.isNaN(finalHT)) {
    if (!Number.isNaN(ttc) && !Number.isNaN(finalTVA)) {
      finalHT = ttc - finalTVA;
    } else if (!Number.isNaN(ttc) && Number.isNaN(tvaRate) && Number.isNaN(finalTVA)) {
      finalHT = ttc;
      finalTVA = 0;
    } else if (!Number.isNaN(ttc) && !Number.isNaN(tvaRate)) {
      finalHT = ttc / (1 + tvaRate / 100);
      finalTVA = ttc - finalHT;
    }
  } else {
    if (Number.isNaN(finalTVA) && !Number.isNaN(ttc) && ttc >= finalHT) {
      finalTVA = ttc - finalHT;
    } else if (Number.isNaN(finalTVA) && !Number.isNaN(tvaRate)) {
      finalTVA = (finalHT * tvaRate) / 100;
    }
  }

  if (!Number.isNaN(finalHT)) out.ht = String(Math.round(finalHT));
  if (!Number.isNaN(finalTVA)) out.tva = String(Math.round(finalTVA));

  return out;
}

// Convertit fichier en image (pour Tesseract)
async function fileToImageURL(file) {
  if (file.type.startsWith("image/")) {
    return URL.createObjectURL(file);
  }
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  }
  throw new Error("Type non supporté");
}

export default function AddPurchaseModal({ open, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    fournisseur: "",
    ref: "",
    ht: "",
    tva: "",
    echeance: new Date().toISOString().slice(0, 10),
    statut: "en_attente",
    mode: "virement",
    attachment: null,
  });

  if (!open) return null;

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      const file = files?.[0] || null;
      if (file) {
        setForm((f) => ({ ...f, attachment: file }));
        setLoading(true);
        try {
          const imageURL = await fileToImageURL(file);
          const { data } = await Tesseract.recognize(imageURL, "eng+fra", {
            logger: (m) => console.log(m),
          });
          const extracted = extractFields(data.text, file.name);
          setForm((f) => ({
            ...f,
            fournisseur: extracted.fournisseur || f.fournisseur,
            ref: extracted.ref || f.ref,
            ht: extracted.ht || f.ht || (extracted.ttc ? extracted.ttc : ""),
            tva:
              extracted.tva ||
              f.tva ||
              (extracted.ht && extracted.ttc
                ? String(parseMoneyFCFA(extracted.ttc) - parseMoneyFCFA(extracted.ht))
                : ""),
          }));
        } catch (err) {
          console.error("OCR error:", err);
          alert("Impossible de lire ce fichier.");
        } finally {
          setLoading(false);
        }
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const save = () => {
    const ht = parseFloat(form.ht || "0");
    const tva = parseFloat(form.tva || "0");
    if (!form.fournisseur || !form.ref || !ht) {
      alert("Champs obligatoires manquants.");
      return;
    }
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Échéance</label>
            <input type="date" name="echeance" value={form.echeance} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Fournisseur</label>
            <input name="fournisseur" value={form.fournisseur} onChange={handleChange} placeholder="Ex.: SDE, Orange Money…" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Référence facture</label>
            <input name="ref" value={form.ref} onChange={handleChange} placeholder="ACH-2025-001" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Montant HT</label>
            <input type="number" name="ht" value={form.ht} onChange={handleChange} placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">TVA</label>
            <input type="number" name="tva" value={form.tva} onChange={handleChange} placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Statut</label>
            <select name="statut" value={form.statut} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="en_attente">En attente</option>
              <option value="payee">Payée</option>
              <option value="partielle">Partiellement payée</option>
              <option value="en_retard">En retard</option>
              <option value="brouillon">Brouillon</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Mode de paiement</label>
            <select name="mode" value={form.mode} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="virement">Virement</option>
              <option value="espece">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="carte">Carte</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500">Pièce jointe (facture/bon)</label>
            <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleChange} className="w-full text-sm" />
            {loading && <p className="text-xs text-blue-500 mt-1">Lecture OCR en cours…</p>}
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
