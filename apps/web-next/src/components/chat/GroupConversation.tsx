'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';

interface GroupConversationProps {
  conversationId: string;
  userId: string;
  participants: Array<{ id: string; name: string; role: string }>;
}

export default function GroupConversation({
  conversationId,
  userId,
  participants,
}: GroupConversationProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, presentUserIds, isConnected, sendMessage } = useChat({ conversationId, userId });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const getSenderRole = (senderId: string) => {
    const participant = participants.find((p) => p.id === senderId);
    return participant?.role || 'CLIENT';
  };

  const getSenderName = (senderId: string) => {
    const participant = participants.find((p) => p.id === senderId);
    return participant?.name || 'Utilisateur';
  };

  const getMessageStyle = (senderId: string) => {
    const role = getSenderRole(senderId);
    if (role === 'DIRECTOR') {
      return 'bg-gradient-to-r from-purple-500 to-purple-700 text-white border-2 border-gold-400';
    }
    if (role === 'ADVISOR') {
      return 'bg-blue-500 text-white';
    }
    return 'bg-gray-200 text-gray-900';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Discussion de groupe</h3>
        <p className="text-sm text-gray-500">
          {participants.length} participant{participants.length > 1 ? 's' : ''} · {presentUserIds.filter((id) => id !== userId).length > 0 ? 'En ligne' : 'Hors ligne'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.messageId} className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-md">
              {msg.senderId !== userId && (
                <p className="text-xs font-semibold mb-1 px-2">
                  {getSenderName(msg.senderId)}
                  {getSenderRole(msg.senderId) === 'DIRECTOR' && ' 👑'}
                </p>
              )}
              <div className={`px-4 py-2 rounded-lg ${getMessageStyle(msg.senderId)}`}>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}
