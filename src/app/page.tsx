"use client";

import { useState } from "react";
import './globals.css';

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! How can I help you today?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [assistantName, setAssistantName] = useState("AI Assistant");
  const [theme, setTheme] = useState("light");

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user" as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      const aiMessage = { role: "ai", content: data.response };
      setMessages((prev) => [...prev, aiMessage as Message]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChatHistory = () => {
    setMessages([{ role: "ai", content: "Hello! How can I help you today?" }]);
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value);
  };

  return (
    <div id="webcrumbs" className={`flex flex-col h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}>
      <div className="w-full bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold text-white">{assistantName}</h1>
        </div>
      </div>

      <div className="flex w-full justify-center gap-6">
        {/* Sidebar - Settings */}
        <aside className="w-[250px] bg-neutral-50 p-4 rounded-md shadow-md flex flex-col gap-4">
          <h2 className="font-title text-xl text-neutral-950"></h2>
          <ul className="flex flex-col gap-2">
            <li
              
              onClick={() => setAssistantName(prompt("Enter new assistant name") || assistantName)}
            >
              
            </li>
            <li className="py-2 px-4 bg-neutral-100 text-neutral-950 rounded-md cursor-pointer hover:bg-neutral-200">
              
            </li>
            <li
              className="py-2 px-4 bg-neutral-100 text-neutral-950 rounded-md cursor-pointer hover:bg-neutral-200"
              onClick={handleClearChatHistory}
            >
              
            </li>
          </ul>
        </aside>

        {/* Main Chat Interface */}
        <div className="w-[800px] bg-white shadow-lg rounded-lg p-6 flex flex-col gap-6 min-h-[600px]">
          <header className="flex justify-between items-center border-b pb-4 border-neutral-200">
            <h1 className="font-title text-3xl text-neutral-950">Chat Assistant</h1>
            <div className="flex gap-4 items-center">
              <button
                className="px-5 py-2 bg-primary-500 text-primary-50 rounded-full hover:bg-primary-600"
                onClick={() => setMessages([{ role: "ai", content: "Hello! How can I help you today?" }])}
              >
                New Chat
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto py-6 px-4 bg-neutral-50 rounded-md">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 mb-4 ${msg.role === "ai" ? "justify-start" : "justify-end flex-row-reverse"}`}
              >
                <div
                  className={`px-4 py-2 rounded-md max-w-[70%] ${msg.role === "ai" ? "bg-primary-500 text-primary-50" : "bg-neutral-100 text-neutral-950"}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c.79 0 1.5-.71 1.5-1.5S8.79 9 8 9s-1.5.71-1.5 1.5S7.21 11 8 11zm8 0c.79 0 1.5-.71 1.5-1.5S16.79 9 16 9s-1.5.71-1.5 1.5.71 1.5 1.5 1.5zm-4 4c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4z" />
                  </svg>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-gray-800 border border-gray-700 text-gray-100">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Input Area */}
          <footer className="flex gap-3 items-center border-t pt-4 border-neutral-200">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 border border-neutral-300 rounded-full py-3 px-5 text-neutral-950 focus:outline-primary-500 shadow-sm"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="h-[48px] w-[48px] bg-primary-500 text-primary-50 rounded-full flex items-center justify-center hover:bg-primary-600 shadow-lg"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
