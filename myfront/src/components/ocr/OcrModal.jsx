// src/components/ocr/OcrModal.js
import React, { useEffect, useState } from "react";
import Tesseract from "tesseract.js";

// util: rend la 1ère page d'un PDF en <canvas>
async function pdfFirstPageToCanvas(blobOrArrayBuffer) {
  const { getDocument } = await import("pdfjs-dist");
  await import("pdfjs-dist/build/pdf.worker.mjs");
  const loadingTask = getDocument(
    blobOrArrayBuffer instanceof ArrayBuffer
      ? { data: blobOrArrayBuffer }
      : { data: await blobOrArrayBuffer.arrayBuffer() }
  );
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

export default function OcrModal({ open, file, onClose }) {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !file) return;

    let revokedUrl = null;
    let aborted = false;

    const run = async () => {
      try {
        setError("");
        setText("");
        setProgress(0);
        setRunning(true);

        let srcForOcr = null;

        // PDF -> canvas, Image -> URL
        if (/pdf/i.test(file.type) || file.name?.toLowerCase().endsWith(".pdf")) {
          const canvas = await pdfFirstPageToCanvas(file);
          srcForOcr = canvas; // on passe le canvas directement
        } else {
          const url = URL.createObjectURL(file);
          revokedUrl = url;
          srcForOcr = url;
        }

        const { data } = await Tesseract.recognize(srcForOcr, "fra", {
          logger: (m) => {
            if (m.status === "recognizing text" && typeof m.progress === "number") {
              setProgress(m.progress);
            }
          },
        });

        if (!aborted) setText(data.text || "");
      } catch (e) {
        console.error(e);
        if (!aborted) setError("Échec de l’OCR. Vérifiez la qualité/format du document.");
      } finally {
        if (revokedUrl) URL.revokeObjectURL(revokedUrl);
        if (!aborted) setRunning(false);
      }
    };

    run();
    return () => {
      aborted = true;
    };
  }, [open, file]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">OCR du document</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {running && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#2e615e] h-2 rounded-full transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <textarea
            className="w-full h-64 border rounded-lg p-3 text-sm"
            value={text}
            readOnly
            placeholder="Résultat OCR…"
          />
          <div className="text-xs text-gray-500">
            Astuce : scans nets (300 dpi) → meilleurs résultats.
          </div>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-end">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
