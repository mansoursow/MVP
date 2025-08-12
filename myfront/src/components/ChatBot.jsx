import React, { useState } from "react";
import axios from "axios";

export default function ChatBot() {
 const [messages, setMessages] = useState([
  {
    role: "system",
    content: `Tu es Accountech Assistant, une assistante IA intelligente et polyvalente au service des entreprises sénégalaises.

Tu maîtrises les domaines suivants :
- la comptabilité et la fiscalité selon le Code Général des Impôts du Sénégal,
- le SYSCOHADA et ses règles d'application,
- les normes IFRS,
- le droit des sociétés commerciales OHADA (acte uniforme sur les sociétés et GIE),
- l’audit, le contrôle de gestion et la gestion financière.

Mais tu es aussi capable de conseiller sur :
- le pilotage des ventes et la stratégie commerciale,
- le marketing digital et traditionnel,
- l’organisation interne d’une entreprise,
- les ressources humaines et la gestion opérationnelle,
- la création et la croissance d’une PME au Sénégal.

Ton rôle est d’aider les entrepreneurs, dirigeants ou comptables à améliorer la gestion globale de leur entreprise.

Si une question sort de ton périmètre strict, tu restes honnête mais essayes d’orienter au mieux. Tu peux proposer des pistes de réflexion pratiques, en t’appuyant sur ton bon sens métier et sur les meilleures pratiques observées dans les entreprises modernes.

Tu es rigoureuse, claire, bienveillante et orientée solution.`
  },
]);


  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setLoading(true);
    setInput("");

    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: newMessages,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_KEY}`,
          },
        }
      );

      const reply = res.data.choices[0].message;

      // ✅ Protection : on s’assure que c’est bien une string
      if (reply && typeof reply.content === "string") {
        setMessages([
          ...newMessages,
          { role: "assistant", content: reply.content },
        ]);
      } else {
        console.error("Réponse invalide reçue de l’API :", reply);
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "❌ Réponse invalide reçue de l’IA. Essayez à nouveau.",
          },
        ]);
      }
    } catch (error) {
      console.error("Erreur API OpenAI :", error);
      alert("Erreur de communication avec l’API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-[350px] bg-white border rounded shadow-lg p-4 z-50">
      <h2 className="text-lg font-bold mb-2">Assistant IA</h2>
      <div className="h-64 overflow-y-auto text-sm mb-2 bg-gray-50 p-2 rounded">
        {messages.slice(1).map((msg, i) => {
          console.log("Message affiché :", msg);
          return (
            <div
              key={i}
              className={`mb-1 ${
                msg.role === "user" ? "text-right" : "text-left text-green-700"
              }`}
            >
              <span>
                {(() => {
                  try {
                    if (typeof msg.content === "string") return msg.content;
                    if (typeof msg.content === "object")
                      return JSON.stringify(msg.content);
                    return String(msg.content); // fallback
                  } catch (e) {
                    console.error("Erreur d'affichage du message :", e);
                    return "[Contenu non affichable]";
                  }
                })()}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="Écrivez votre question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-[#2e615e] text-white px-3 rounded text-sm"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
