import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Utensils } from 'lucide-react';
import { useKitchenStore } from '../store/useKitchenStore';
import { sendAiChatMessage } from '../lib/aiClient';

interface ChatMessage {
  id: string;
  sender: 'user' | 'chef';
  text: string;
}

export const FloatingAiChat: React.FC = () => {
  const { isChatOpen, setChatOpen, menu, config } = useKitchenStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'chef',
      text: 'Namaste! I am your Second Home chef assistant in Biratnagar. Looking for steaming momos, spicy starters, or homestyle biryani tonight?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const menuSummary = menu
        .filter((m) => !m.hid)
        .map((m) => ({ name: m.name, price: m.p, cat: m.cat.toString() }));

      const reply = await sendAiChatMessage(textToSend, menuSummary);

      const chefMsg: ChatMessage = {
        id: 'c_' + Date.now(),
        sender: 'chef',
        text: reply,
      };
      setMessages((prev) => [...prev, chefMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'chef',
          text: 'Namaste! We recommend our Chicken Steam Momo or Kadhai Chicken. Feel free to call us at +977-9761341498!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-gray-950 font-black rounded-full shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer min-h-[48px]"
          aria-label="Ask about the menu with AI Chef"
        >
          <Sparkles className="w-5 h-5 text-gray-950 animate-pulse" />
          <span className="text-xs sm:text-sm font-extrabold tracking-wide">
            Ask Chef AI
          </span>
        </button>
      )}

      {/* Chat Window Modal */}
      {isChatOpen && (
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[92vw] sm:w-96 max-w-sm bg-[#111827] border border-[#1f2937] rounded-3xl shadow-2xl shadow-black/80 flex flex-col h-[520px] overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
          role="dialog"
          aria-label="Chef Assistant Chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#090d16] border-b border-[#1f2937]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white font-heading">
                  Second Home Chef AI
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Biratnagar Midnight Assistant
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-full bg-gray-800 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'chef' && (
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-none'
                      : 'bg-[#090d16] border border-[#1f2937] text-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-amber-300 italic p-2 bg-[#090d16] rounded-xl w-fit border border-[#1f2937]">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Chef is typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="p-2 border-t border-[#1f2937] bg-[#090d16]/40 flex gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <button
              onClick={() => handleSend('What are your best midnight momos?')}
              className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white shrink-0 transition"
            >
              🥟 Best Momos?
            </button>
            <button
              onClick={() => handleSend('Suggest a spicy non-veg dinner')}
              className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white shrink-0 transition"
            >
              🍗 Spicy Non-Veg
            </button>
            <button
              onClick={() => handleSend('What vegetarian dishes do you have?')}
              className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white shrink-0 transition"
            >
              🥗 Veg Options
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#090d16] border-t border-[#1f2937] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about momo, thukpa, biryani..."
              className="flex-1 bg-[#111827] border border-gray-700 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none min-h-[44px]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 font-bold rounded-xl transition disabled:opacity-50 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default FloatingAiChat;
