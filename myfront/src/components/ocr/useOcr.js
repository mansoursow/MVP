// src/components/ocr/useOcr.js
import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";

export default function useOcr({ lang = "fra" } = {}) {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const workerRef = useRef(null);

  const ensureWorker = async () => {
    if (!workerRef.current) {
      const worker = await createWorker({
        logger: (m) => {
          if (m.status === "recognizing text") setProgress(m.progress);
        },
      });
      await worker.loadLanguage(lang);
      await worker.initialize(lang);
      workerRef.current = worker;
    }
    return workerRef.current;
  };

  const recognize = async (imageOrCanvas) => {
    setRunning(true);
    setProgress(0);
    setText("");
    try {
      const worker = await ensureWorker();
      const { data } = await worker.recognize(imageOrCanvas);
      setText(data.text || "");
      return data.text || "";
    } finally {
      setRunning(false);
    }
  };

  const dispose = async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  return { recognize, progress, text, running, dispose };
}
