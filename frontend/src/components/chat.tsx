import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, Send, StopCircle, Volume2, Languages, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: number;
}

interface Language {
  name: string;
  code: string;
  nativeName?: string;
  voiceLang?: string;
}

const languages: Language[] = [
  { name: "English", code: "en", nativeName: "English", voiceLang: "en-US" },
  { name: "Hindi", code: "hi", nativeName: "हिन्दी", voiceLang: "hi-IN" },
  { name: "Tamil", code: "ta", nativeName: "தமிழ்", voiceLang: "ta-IN" },
  { name: "Telugu", code: "te", nativeName: "తెలుగు", voiceLang: "te-IN" },
  { name: "Bengali", code: "bn", nativeName: "বাংলা", voiceLang: "bn-IN" },
  { name: "Marathi", code: "mr", nativeName: "मराठी", voiceLang: "mr-IN" },
  { name: "Gujarati", code: "gu", nativeName: "ગુજરાતી", voiceLang: "gu-IN" },
  { name: "Kannada", code: "kn", nativeName: "ಕನ್ನಡ", voiceLang: "kn-IN" },
  { name: "Malayalam", code: "ml", nativeName: "മലയാളം", voiceLang: "ml-IN" },
];

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechId, setCurrentSpeechId] = useState<number | null>(null);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechStatusRef = useRef<"idle" | "speaking">("idle");

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0) {
        console.log(
          "Available voices:",
          voices.map((v) => `${v.name} (${v.lang})`)
        );
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback(
    (text: string, langCode: string, messageId: number) => {
      if (speechStatusRef.current === "speaking") {
        window.speechSynthesis.cancel();
      }

      speechStatusRef.current = "speaking";
      setCurrentSpeechId(messageId);
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      const voiceLang =
        languages.find((l) => l.code === langCode)?.voiceLang || "en-US";
      utterance.lang = voiceLang;
      utterance.rate = langCode === "hi" ? 0.8 : 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        console.log(
          "Speech started for message:",
          messageId,
          "Language:",
          voiceLang
        );
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.log("Speech ended");
        speechStatusRef.current = "idle";
        setIsSpeaking(false);
        setCurrentSpeechId(null);
      };

      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        speechStatusRef.current = "idle";
        setIsSpeaking(false);
        setCurrentSpeechId(null);
      };

      const voice =
        availableVoices.find(
          (v) =>
            v.lang.toLowerCase() === voiceLang.toLowerCase() ||
            v.lang
              .toLowerCase()
              .startsWith(voiceLang.split("-")[0].toLowerCase())
        ) ||
        availableVoices.find((v) => v.lang.toLowerCase().includes("en")) ||
        availableVoices[0];

      if (voice) {
        console.log(
          `Using voice: ${voice.name} (${voice.lang}) for ${voiceLang}`
        );
        utterance.voice = voice;
      } else {
        console.warn(`No suitable voice found for ${voiceLang}, using default`);
      }

      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Speech synthesis failed:", error);
        speechStatusRef.current = "idle";
        setIsSpeaking(false);
        setCurrentSpeechId(null);
      }
    },
    [availableVoices]
  );

  const stopSpeech = useCallback(() => {
    try {
      window.speechSynthesis.cancel();
      speechStatusRef.current = "idle";
      setIsSpeaking(false);
      setCurrentSpeechId(null);
    } catch (error) {
      console.error("Error stopping speech:", error);
    }
  }, []);

  const handleSpeechClick = useCallback(
    (message: Message) => {
      const isCurrentMessage = currentSpeechId === message.id;
      const isSpeakingNow = speechStatusRef.current === "speaking";

      if (isSpeakingNow && isCurrentMessage) {
        stopSpeech();
      } else {
        speak(message.content, selectedLanguage.code, message.id);
      }
    },
    [currentSpeechId, selectedLanguage.code, speak, stopSpeech]
  );

  const renderMessageContent = (content: string) => {
    try {
      const markdown = marked(content);
      const sanitized = sanitizeHtml(markdown as string, {
        allowedTags: [
          "p",
          "strong",
          "em",
          "ul",
          "ol",
          "li",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "br",
        ],
        allowedAttributes: {},
      });
      return { __html: sanitized };
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return { __html: content };
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      id: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const prompt = `You are an agricultural expert. Respond to the following question in ${selectedLanguage.name} (language code: ${selectedLanguage.code}). 
      Provide detailed and helpful information about crops, farming challenges, government schemes for farmers, and current market prices.
      Format your response using Markdown for clarity with proper headings, bullet points, and numbered lists where appropriate.
      Ensure the response is entirely in ${selectedLanguage.name}, including any examples or technical terms.

      Question: ${inputMessage}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const assistantMessage: Message = {
        role: "assistant",
        content: text,
        id: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          selectedLanguage.code === "en"
            ? "I apologize, but I encountered an error while processing your request. Please try again."
            : "माफ कीजिए, मुझे आपके अनुरोध को संसाधित करते समय एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
        id: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSendMessage(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const LanguageSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Languages className="w-5 h-5 text-primary" />
        <h3 className="font-medium">Language Settings</h3>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Select Language</p>
        <Select
          value={selectedLanguage.code}
          onValueChange={(value) => {
            const lang = languages.find((l) => l.code === value);
            if (lang) setSelectedLanguage(lang);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center">
                  <span className="mr-2">{lang.nativeName}</span>
                  <span className="text-muted-foreground text-xs">
                    {lang.name}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <p className="text-sm text-muted-foreground mb-2">Current Language</p>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium">{selectedLanguage.nativeName}</p>
            <p className="text-sm text-muted-foreground">
              {selectedLanguage.name}
            </p>
          </div>
          <Badge variant="outline">Active</Badge>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b py-3 px-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <div className="py-4">
                <div className="flex items-center space-x-2 mb-6">
                  <Avatar>
                    <AvatarImage src="https://images.unsplash.com/photo-1495107334309-fcf20504a5ab" />
                    <AvatarFallback>AC</AvatarFallback>
                  </Avatar>
                  <h2 className="font-semibold">AgriChat</h2>
                </div>
                <LanguageSelector />
              </div>
            </SheetContent>
          </Sheet>

          <Avatar>
            <AvatarImage src="https://images.unsplash.com/photo-1495107334309-fcf20504a5ab" />
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold">🌾 AgriChat</h1>
            <p className="text-sm text-muted-foreground">
              Your Agricultural Assistant
            </p>
          </div>
        </div>
        <div className="md:hidden">
          <Badge variant="secondary">{selectedLanguage.nativeName}</Badge>
        </div>
      </header>

      <div className="flex flex-1">
        <div className="hidden md:block w-64 border-r p-4 bg-background">
          <LanguageSelector />
        </div>

        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8">
                  <div className="bg-primary/10 p-6 rounded-full mb-4">
                    <Languages className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Welcome to AgriChat
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    Ask me anything about agriculture in {selectedLanguage.name}
                    . I can help with crop advice, weather information, and
                    more.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[90%] md:max-w-[70%] ${
                      message.role === "user"
                        ? "bg-primary text-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-xs ${
                          message.role === "user"
                            ? "text-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.role === "user" ? "You" : "AgriChat"}
                      </span>
                      <span
                        className={`text-xs ${
                          message.role === "user"
                            ? "text-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(new Date(message.id))}
                      </span>
                    </div>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={renderMessageContent(
                        message.content
                      )}
                    />
                    {message.role === "assistant" && (
                      <Button
                        variant={
                          currentSpeechId === message.id && isSpeaking
                            ? "destructive"
                            : "secondary"
                        }
                        size="sm"
                        onClick={() => handleSpeechClick(message)}
                        className="mt-2"
                        disabled={
                          !availableVoices.some((v) =>
                            v.lang
                              .toLowerCase()
                              .includes(selectedLanguage.code.toLowerCase())
                          )
                        }
                      >
                        {currentSpeechId === message.id && isSpeaking ? (
                          <>
                            <StopCircle className="w-4 h-4 mr-2 animate-pulse" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 mr-2" />
                            Read Aloud
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg p-4 max-w-[70%] bg-muted">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[180px]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0">
            <form
              onSubmit={handleSendMessage}
              className="flex gap-2 max-w-3xl mx-auto"
            >
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={() => setIsRecording(!isRecording)}
                disabled={isLoading}
              >
                {isRecording ? (
                  <StopCircle className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type your question in ${selectedLanguage.name}...`}
                disabled={isLoading || isRecording}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AgriChat supports {languages.length} languages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
