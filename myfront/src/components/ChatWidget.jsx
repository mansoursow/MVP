// src/components/ChatWidget.jsx
import React, { useState } from "react";
import ChatBot from "./ChatBot";

export default function ChatWidget() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {visible && <ChatBot />}

      <button
        onClick={() => setVisible(!visible)}
        className="fixed bottom-4 right-4 z-50 bg-[#2e615e] text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1 hover:bg-[#244d4a] transition-all"
      >
        <span className="text-sm">💬</span> {/* Emoji plus petit */}
        {visible ? "Fermer l'IA" : "IA Comptable"}
      </button>
    </>
  );
}
