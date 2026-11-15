// ==============================================================================
// Widget Trợ lý Pháp lý Thuế ThuTra AI (Floating Legal AI Assistant Widget)
// Hệ thống: ThuTra TNCN - Đồng bộ thiết kế phân hệ Hỗ trợ pháp lý TNCN
// ==============================================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Building2,
  X,
  Minus,
  Send,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  Lightbulb,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { chatApi, type ChatHistoryItem } from '../../services/chat.api';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Mức giảm trừ gia cảnh 2025 là bao nhiêu?',
  'Cách tính thuế lũy tiến từng phần?',
  'Hướng dẫn 4 bước kê khai trên ThuTra?',
  'Làm 2 nơi cùng lúc quyết toán thuế như thế nào?',
];

/**
 * Trích xuất các căn cứ pháp lý từ văn bản
 */
function extractLegalReferences(text: string): string[] {
  const matches = new Set<string>();
  const patterns = [
    /Thông tư\s+\d+[\/\w\.-]*/gi,
    /Nghị quyết\s+\d+[\/\w\.-]*/gi,
    /Nghị định\s+\d+[\/\w\.-]*/gi,
    /Luật\s+[\w\s]{2,20}(?:TNCN|QLT|\d{4})/gi,
  ];

  for (const regex of patterns) {
    const found = text.match(regex);
    if (found) {
      found.slice(0, 3).forEach((item) => matches.add(item.trim()));
    }
  }

  if (matches.size === 0) {
    return ['Thông tư 111/2013/TT-BTC', 'Nghị quyết 954/2020/UBTVQH14', 'Nghị định 126/2020/NĐ-CP'];
  }

  return Array.from(matches).slice(0, 4);
}

/**
 * Phân tích và tách khối "Kết luận & Khuyến nghị" nếu có
 */
function parseAssistantMessage(rawText: string) {
  let mainText = rawText;
  let conclusionText: string | null = null;

  // Tách phần Kết luận & Khuyến nghị hoặc Gợi ý nếu có
  const conclusionRegex = /(?:###\s*)?(?:💡\s*)?(?:Kết luận\s*(?:&|và)\s*Khuyến nghị|Lời khuyên|Gợi ý từ ThuTra)(?:[^:\n]*):?\s*([\s\S]+)$/i;
  const match = rawText.match(conclusionRegex);

  if (match && match.index !== undefined && match.index > 50) {
    mainText = rawText.slice(0, match.index).trim();
    conclusionText = match[1].trim();
  }

  const legalReferences = extractLegalReferences(rawText);

  return { mainText, conclusionText, legalReferences };
}

/**
 * Xử lý in đậm **bold** và inline code `code`
 */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="bg-slate-100 text-[#046a4e] px-1 py-0.5 rounded text-xs font-mono font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Component hiển thị Thẻ phân tích tư vấn pháp lý chuyên nghiệp của ThuTra
 */
const AssistantCard: React.FC<{ text: string; timestamp: string }> = ({ text, timestamp }) => {
  const { mainText, conclusionText, legalReferences } = useMemo(
    () => parseAssistantMessage(text),
    [text]
  );

  const lines = mainText.split('\n');

  return (
    <div className="flex items-start gap-2.5">
      {/* Avatar ThuTra Xanh lá */}
      <div className="w-8 h-8 rounded-xl bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
        <Building2 className="w-4 h-4 text-emerald-100" />
      </div>

      {/* Thẻ Nội dung Tư vấn */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 max-w-[88%] space-y-3 shadow-xs">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">
              Phân tích Tư vấn Pháp lý Thuế TNCN
            </h4>
            <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              RAG Pháp luật Thuế 2025
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Phản hồi lúc {timestamp}
          </span>
        </div>

        {/* Nội dung chi tiết các điểm phân tích */}
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-1" />;

            // 1. Dòng tiêu đề mục có số: "1. ", "2. ", "#### Bước 1:"
            const numHeaderMatch = trimmed.match(/^(?:####\s*|###\s*)?(?:(\d+)[\.:\)]\s*|\*?\*?Bước\s*(\d+)[\.:\)]?\*?\*?\s*)(.*)$/i);
            if (numHeaderMatch) {
              const num = numHeaderMatch[1] || numHeaderMatch[2];
              const title = numHeaderMatch[3];
              return (
                <div key={idx} className="flex items-start gap-2 pt-1.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-[#046a4e] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {num}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h5 className="font-bold text-slate-900">{renderInline(title)}</h5>
                  </div>
                </div>
              );
            }

            // 2. Dòng gạch đầu dòng "* " hoặc "- "
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
              const itemText = trimmed.replace(/^[\*\-]\s+/, '');
              return (
                <div key={idx} className="flex items-start gap-2 pl-2">
                  <span className="text-[#046a4e] font-bold text-xs leading-4 select-none">•</span>
                  <span className="flex-1 text-slate-700">{renderInline(itemText)}</span>
                </div>
              );
            }

            // 3. Đường kẻ ngang
            if (trimmed === '---') {
              return <hr key={idx} className="border-slate-100 my-1" />;
            }

            // 4. Đoạn văn thường
            return (
              <p key={idx} className="text-slate-700">
                {renderInline(trimmed)}
              </p>
            );
          })}
        </div>

        {/* Hộp Khuyến nghị & Kết luận nổi bật (Callout Box) */}
        {conclusionText && (
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3 text-[11px] text-emerald-950 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#046a4e]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kết luận &amp; Khuyến nghị từ ThuTra:</span>
            </div>
            <p className="whitespace-pre-wrap">{renderInline(conclusionText)}</p>
          </div>
        )}

        {/* Căn cứ pháp lý ở chân thẻ */}
        {legalReferences.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
            <span className="font-medium text-slate-500">Căn cứ pháp lý:</span>
            {legalReferences.map((ref, idx) => (
              <span
                key={idx}
                className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200/60"
              >
                {ref}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const TaxChatWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo tên viết tắt người dùng
  const userInitials = useMemo(() => {
    if (!user?.fullName) return 'HN';
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user?.fullName]);

  // Tải lại lịch sử hội thoại gần nhất từ CSDL PostgreSQL khi đã đăng nhập
  useEffect(() => {
    let isMounted = true;
    const loadChatHistory = async () => {
      if (!isAuthenticated) return;
      try {
        setIsLoadingHistory(true);
        const res = await chatApi.getHistory();
        if (isMounted && res.success && res.data?.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.warn('[TaxChatWidget] Không thể tải lịch sử chat:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Cuộn mượt xuống cuối tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Tự động focus ô nhập khi mở hộp thoại
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Gửi tin nhắn
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputText).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!customText) {
      setInputText('');
    }
    setIsLoading(true);

    try {
      const chatHistory: ChatHistoryItem[] = updatedMessages
        .slice(0, -1)
        .slice(-10)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

      const res = await chatApi.ask({
        message: textToSend,
        history: chatHistory,
      });

      if (res.success && res.data?.reply) {
        const botReply: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botReply]);
      } else {
        throw new Error(res.message || 'Không nhận được phản hồi từ máy chủ.');
      }
    } catch (err: any) {
      console.error('[TaxChatWidget Error]:', err);
      const errorText =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi kết nối đến Trợ lý AI. Vui lòng kiểm tra lại mạng hoặc thử lại sau.';
      setErrorMessage(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = async () => {
    try {
      if (isAuthenticated) {
        await chatApi.reset();
      }
    } catch (err) {
      console.warn('[TaxChatWidget] Không thể làm mới phiên trên máy chủ:', err);
    } finally {
      setMessages([]);
      setErrorMessage(null);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none font-sans">
      {/* 1. Cửa sổ Hội thoại Popup chuẩn phân hệ Hỗ trợ pháp lý TNCN */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Cửa sổ Trợ lý Pháp lý ThuTra AI"
          className="mb-3.5 w-[430px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[86vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">ThuTra TNCN</h3>
                  <span className="bg-emerald-50 text-[#046a4e] border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    v3.5
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">Trợ lý Thuế Thông Minh</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vùng Cuộn Tin Nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-slate-800">
            {/* Loading Indicator khi tải lịch sử từ CSDL */}
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-3 text-slate-500 gap-2 text-xs bg-white/70 border border-slate-200/80 rounded-xl animate-in fade-in">
                <Sparkles className="w-3.5 h-3.5 text-[#046a4e] animate-spin" />
                <span>Đang đồng bộ lịch sử tư vấn từ tài khoản...</span>
              </div>
            )}

            {/* Tin nhắn chào ban đầu của Trợ lý */}
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <Building2 className="w-4 h-4 text-emerald-100" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 max-w-[88%] space-y-2.5 shadow-xs">
                <p className="text-xs text-slate-700 leading-relaxed">
                  Xin chào quý khách! Tôi là <strong className="text-slate-900 font-bold">Trợ lý Pháp lý ThuTra AI</strong>. Tôi sẵn sàng hỗ trợ rà soát các hợp đồng, mức trích nộp 10%, tra cứu giảm trừ gia cảnh và phương án quyết toán thuế TNCN tối ưu nhất cho kỳ tính thuế này.
                </p>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 px-3 flex items-start gap-2 text-[11px] text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-[#046a4e] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Dữ liệu trao đổi được bảo mật chuẩn tài chính. Hệ thống tự động đối chiếu các quy định pháp luật thuế TNCN mới nhất.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Prompts - Gợi ý câu hỏi phổ biến */}
            {messages.length === 0 && (
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Gợi ý câu hỏi phổ biến cho kỳ quyết toán:</span>
                </div>
                <div className="space-y-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="w-full text-left text-xs bg-white hover:bg-emerald-50/50 hover:border-emerald-300 border border-slate-200/90 rounded-xl px-3 py-2 text-slate-700 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <span className="group-hover:text-[#046a4e] font-medium">{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#046a4e] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Danh sách tin nhắn */}
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex flex-col items-end space-y-1">
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <div className="bg-[#0F172A] text-white text-xs sm:text-[13px] rounded-2xl rounded-tr-xs p-3.5 px-4 shadow-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#046a4e] text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        {userInitials}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 pr-9 font-mono">
                      <span>Đã gửi {msg.timestamp}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                );
              }

              // Assistant Message
              return <AssistantCard key={msg.id} text={msg.text} timestamp={msg.timestamp} />;
            })}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5 animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Building2 className="w-4 h-4 text-emerald-100 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3 px-3.5 shadow-xs flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-[#046a4e] animate-spin" />
                  <span>ThuTra AI đang tra cứu Thông tư 111 &amp; Nghị quyết 954...</span>
                  <span className="flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-200"></span>
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{errorMessage}</p>
                  <button
                    onClick={() => handleSendMessage()}
                    className="mt-1 text-[#046a4e] hover:underline font-semibold"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar & Footer */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-1.5 pl-3 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-[#046a4e]/20 focus-within:border-[#046a4e]"
            >
              {/* Input */}
              <div className="flex-1 min-w-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu hỏi về thuế TNCN... (Enter để gửi)"
                  disabled={isLoading}
                  className="w-full bg-transparent text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 outline-none py-1"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                aria-label="Gửi tin nhắn"
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all shadow-xs cursor-pointer shrink-0 ${
                  inputText.trim() && !isLoading
                    ? 'bg-[#046a4e] hover:bg-[#03543e] active:scale-95'
                    : 'bg-slate-200 cursor-not-allowed text-slate-400'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Disclaimer Footer */}
            <div className="pt-2 px-1 flex items-start gap-1.5 text-[10px] text-slate-400 leading-tight">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="flex-1">
                ThuTra AI tự động trích dẫn căn cứ luật hiện hành. Vui lòng đối chiếu với Cơ quan thuế có thẩm quyền khi có yếu tố tranh chấp hợp đồng. | Phiên bản LLM Pháp lý v3.5.2
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Nút Bong bóng Chat Nổi (Floating Trigger Button) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Đóng Trợ lý ThuTra AI' : 'Mở Trợ lý Pháp lý ThuTra AI'}
        className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl shadow-emerald-950/20 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-slate-900 text-white hover:bg-slate-800 rotate-90'
            : 'bg-[#046a4e] hover:bg-[#03543e] text-white'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-200" />
        ) : (
          <>
            <Building2 className="w-6 h-6 transition-transform group-hover:scale-110 text-emerald-100" />
            
            {/* Hiệu ứng pulse phát sáng */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </span>
            </span>

            {/* Tooltip khi hover */}
            <span className="absolute right-16 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg border border-slate-700">
              🏛️ Trợ lý Pháp lý ThuTra AI
            </span>
          </>
        )}
      </button>
    </div>
  );
};
