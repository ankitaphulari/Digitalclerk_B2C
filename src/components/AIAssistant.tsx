import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestion?: boolean;
}

interface AIAssistantProps {
  formType?: string;
  extractedData?: Record<string, any>;
  onFieldHelp?: (field: string, suggestion: string) => void;
}

const QUICK_SUGGESTIONS = {
  general: [
    "How do I fill the address field correctly?",
    "What documents do I need for this form?",
    "Why is my document not being processed?",
    "How to improve document scan quality?"
  ],
  aadhaar: [
    "What is proof of identity for Aadhaar?",
    "Address proof requirements for Aadhaar",
    "How to update Aadhaar information?",
    "Aadhaar enrollment process steps"
  ],
  passport: [
    "Required documents for passport application",
    "How to fill emergency contact details?",
    "Passport application fees and payment",
    "Police verification process"
  ],
  pan: [
    "PAN card application documents needed",
    "How to fill father's/mother's name correctly?",
    "PAN card fees and processing time",
    "Signature guidelines for PAN"
  ]
};

const AI_RESPONSES = {
  "address": "For address fields, enter your complete current residential address exactly as it appears on your proof documents. Include house/flat number, street, area, city, state, and PIN code.",
  "documents": "Required documents vary by form type. Generally you need: Identity proof (Aadhaar, Passport, Voter ID), Address proof (Bank statement, Utility bill), and Date of birth proof (Birth certificate, School certificate).",
  "scan_quality": "For better OCR results: 1) Ensure good lighting, 2) Keep documents flat and straight, 3) Avoid shadows, 4) Use high resolution, 5) Clean the camera lens.",
  "processing": "Document processing may fail due to: poor image quality, unsupported format, or damaged documents. Try re-uploading with better quality images.",
  "fees": "Government form fees vary. Check the official website for current fee structure. Most forms accept online payment via debit/credit card, net banking, or UPI."
};

function AIAssistant({ formType = 'general', extractedData = {}, onFieldHelp }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hello! I'm your AI assistant for ${formType} form filling. I can help you understand form requirements, explain field meanings, and provide guidance throughout the process. How can I help you today?`,
      timestamp: new Date()
    }
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

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('address')) {
      return AI_RESPONSES.address;
    } else if (message.includes('document') || message.includes('proof')) {
      return AI_RESPONSES.documents;
    } else if (message.includes('scan') || message.includes('quality') || message.includes('blur')) {
      return AI_RESPONSES.scan_quality;
    } else if (message.includes('process') || message.includes('fail') || message.includes('error')) {
      return AI_RESPONSES.processing;
    } else if (message.includes('fee') || message.includes('cost') || message.includes('payment')) {
      return AI_RESPONSES.fees;
    } else if (message.includes('help') || message.includes('how')) {
      return `I can help you with ${formType} form filling. Some common areas I assist with include: understanding field requirements, document specifications, filling guidelines, and troubleshooting issues. What specific area would you like help with?`;
    } else {
      return `I understand you're asking about "${userMessage}". While I don't have a specific answer for that, I can help you with form filling guidelines, document requirements, and field explanations. Could you be more specific about what you need help with?`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const suggestions = QUICK_SUGGESTIONS[formType as keyof typeof QUICK_SUGGESTIONS] || QUICK_SUGGESTIONS.general;

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px]">
      <Card className="h-full flex flex-col shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-blue-600" />
              AI Assistant
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 space-y-4">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'ai' && <Bot className="h-4 w-4 mt-0.5 text-blue-600" />}
                      {message.type === 'user' && <User className="h-4 w-4 mt-0.5" />}
                      <div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about the form..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIAssistant;