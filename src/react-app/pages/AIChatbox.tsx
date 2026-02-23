import { useState, useRef, useEffect } from "react";
import { Send, Loader2, AlertCircle, Sparkles, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { useData } from "@/react-app/context/DataContext";
import { useIoTStream } from "@/react-app/hooks/useIoTStream";
import { analyzeWithGemini } from "@/services/geminiService";
import { parseMarkdownLines } from "@/react-app/lib/markdownParser.tsx";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  loading?: boolean;
}

export default function AIChatboxPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI-powered Waste Management Assistant. I can help you analyze your city's waste collection data, provide insights, and offer recommendations. Ask me anything about your dustbins, complaints, or waste management trends!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { postcodes, complaints } = useData();
  const { liveBins } = useIoTStream();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getContextualPrompt = (userMessage: string): string => {
    const dataContext = {
      totalBins: postcodes.reduce((sum, p) => sum + p.dustbins.length, 0),
      criticalBins: postcodes.reduce((sum, p) => {
        return (
          sum +
          p.dustbins.filter((d) => {
            const live = liveBins.find((b) => b.deviceId === d.id);
            return (live?.fillLevel ?? d.fillLevel) > 80;
          }).length
        );
      }, 0),
      averageFill:
        liveBins.length > 0
          ? (liveBins.reduce((sum, b) => sum + b.fillLevel, 0) / liveBins.length).toFixed(1)
          : "unknown",
      offlineDevices: liveBins.filter((b) => b.status === "offline").length,
      lowBatteryDevices: liveBins.filter((b) => b.battery && b.battery < 20).length,
      totalComplaints: complaints.length,
      pendingComplaints: complaints.filter((c) => c.status === "pending").length,
    };

    return `You are an expert waste management AI assistant for SwachhPath, a smart waste management system for Gorakhpur Smart City.

Current System Status:
- Total Dustbins: ${dataContext.totalBins}
- Critical Bins (>80% full): ${dataContext.criticalBins}
- Average Fill Level: ${dataContext.averageFill}%
- Offline Devices: ${dataContext.offlineDevices}
- Low Battery Devices (<20%): ${dataContext.lowBatteryDevices}
- Total Complaints: ${dataContext.totalComplaints}
- Pending Complaints: ${dataContext.pendingComplaints}

User Message: "${userMessage}"

Please provide a helpful, concise response addressing the user's question while considering the current system status. If applicable, provide actionable recommendations. Keep responses under 300 words.`;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Add loading message
    const loadingMsg: Message = {
      id: `loading_${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      loading: true,
    };
    setMessages((prev) => [...prev, loadingMsg]);

    setIsLoading(true);

    try {
      const prompt = getContextualPrompt(userMessage);
      const response = await analyzeWithGemini(prompt);

      // Replace loading message with actual response
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get response from AI";
      setError(errorMsg);

      // Replace loading message with error
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: `error_${Date.now()}`,
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMsg}. Please try again or check if the AI service is properly configured.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your AI-powered Waste Management Assistant. I can help you analyze your city's waste collection data, provide insights, and offer recommendations. Ask me anything about your dustbins, complaints, or waste management trends!",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-3 sm:p-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI Assistant</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ask about your waste system
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className="gap-2 w-full sm:w-auto text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 w-full flex justify-center">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none border border-border"
                  }`}
                >
                  {message.loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <div className="text-sm break-words">
                      {message.role === "assistant" 
                        ? <>{parseMarkdownLines(message.content)}</> 
                        : <p className="whitespace-pre-wrap">{message.content}</p>
                      }
                    </div>
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-3 sm:mx-6 max-w-4xl mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-500">
              <p className="font-medium">Error</p>
              <p className="text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border p-3 sm:p-6">
          <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your waste system..."
              disabled={isLoading}
              className="flex-1 h-10 sm:h-12 rounded-lg text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="h-10 sm:h-12 px-3 sm:px-6 gap-2 text-xs sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Sending</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClearChat}
              className="h-10 sm:h-12 px-3 sm:px-4"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
