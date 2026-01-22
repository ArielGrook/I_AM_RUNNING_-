'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Send, MessageSquare, Bot, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  // No sidebar found in chat.
  const t = useTranslations();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi there! 👋 I'm your AI website builder assistant. Tell me about the website you want to create - what kind of business or project is it for?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "That's a great idea! I can help you create a beautiful website for that. Would you like me to show you some template options?",
        "I understand what you're looking for. Based on your description, I recommend starting with one of our popular templates. Let me prepare some suggestions for you.",
        "Perfect! I can see you're looking for a professional website. Let me create some template suggestions that would work great for your project.",
        "Thanks for sharing those details! I have some great template ideas that would match your vision. Let me show you what's available.",
      ];

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-[#262626] flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F97316] rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">
              I AM RUNNING AI CHAT
            </h1>
          </div>
          <div className="hidden sm:block w-[80px]" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Chat Container - Claude Style */}
      <div className="flex-1 px-4 overflow-hidden">
        <div className="max-w-3xl mx-auto h-full flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto py-4 sm:py-6">
            <div className="space-y-10">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className="inline-block max-w-[90%] sm:max-w-[80%] text-gray-900 dark:text-white"
                    >
                      <p className="text-base sm:text-lg leading-relaxed">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-left"
                >
                  <div className="inline-block">
                    <div className="flex space-x-1 py-3">
                      <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="py-4 sm:py-12 sticky bottom-0 bg-white dark:bg-[#262626] border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your website idea..."
                  className="pr-12 py-4 sm:py-5 text-base sm:text-lg border-none outline-none focus:outline-none focus:ring-0 bg-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                    inputValue.trim() ? 'text-[#F97316]' : 'text-gray-400'
                  } hover:text-[#F97316] transition-colors`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
