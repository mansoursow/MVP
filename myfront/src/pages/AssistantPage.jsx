// src/pages/AssistantPage.jsx
import React from "react";
import ChatBot from "../components/ChatBot";

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] p-6">
      <h1 className="text-xl font-bold mb-4">Assistant IA Accountech</h1>
      <ChatBot />
    </div>
  );
}
