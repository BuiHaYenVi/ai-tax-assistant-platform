// ==============================================================================
// Khu vực Hội thoại Phân hệ Hỗ trợ Pháp lý TNCN (Chat Area Component)
// Hệ thống: ThuTra TNCN - Kết nối CSDL PostgreSQL & Gemini AI
// ==============================================================================

import React, { useRef, useEffect, useMemo } from 'react';
import {
  Building2,
  FileText,
  Share2,
  SlidersHorizontal,
  RotateCcw,
  Lightbulb,
  ShieldCheck,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import type { PromptChip } from '../../data/mockChatData';
import { mockPromptChips } from '../../data/mockChatData';
import { ChatInputBar } from './ChatInputBar';
import { useAuth } from '../../contexts/AuthContext';

export interface ChatAreaMessage {
  id: string;
  sender: 'bot' | 'user';
  timestamp: string;
  text?: string;
  legalReferences?: string[];
}

interface ChatAreaProps {
  messages: ChatAreaMessage[];
  onSendMessage: (text: string) => void;
  onSelectPromptChip: (chip: PromptChip) => void;
  onResetChat?: () => void;
  onExportPdf?: () => void;
  onShareChat?: () => void;
  onSettingsClick?: () => void;
  onAttachFile?: () => void;
  onCaptureCamera?: () => void;
  onVoiceInput?: () => void;
  isAiTyping?: boolean;
  isLoadingHistory?: boolean;
}

/**
 * Trích xuất căn cứ pháp lý từ nội dung câu trả lời
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
 * Component hiển thị Thẻ phân tích tư vấn pháp lý chuyên sâu
 */
const AssistantCard: React.FC<{ text: string; timestamp: string; legalRefsOverride?: string[] }> = ({
  text,
  timestamp,
  legalRefsOverride,
}) => {
  const { mainText, conclusionText, legalReferences } = useMemo(
    () => parseAssistantMessage(text),
    [text]
  );

  const refs = legalRefsOverride && legalRefsOverride.length > 0 ? legalRefsOverride : legalReferences;
  const lines = mainText.split('\n');

  return (
    <div className="flex items-start gap-3">
      {/* Avatar ThuTra Xanh Lá */}
      <div className="w-8 h-8 rounded-xl bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
        <Building2 className="w-4 h-4 text-emerald-100" />
      </div>

      {/* Thẻ Nội dung Tư vấn */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 max-w-2xl space-y-3.5 shadow-2xs w-full">
        {/* Message Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight">
              Phân tích Tư vấn Pháp lý Thuế TNCN
            </h3>
            <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              RAG Pháp luật Thuế 2025
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Phản hồi lúc {timestamp}
          </span>
        </div>

        {/* Nội dung chi tiết các điểm phân tích */}
        <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-1" />;

            // 1. Dòng tiêu đề mục có số: "1. ", "2. ", "#### Bước 1:"
            const numHeaderMatch = trimmed.match(
              /^(?:####\s*|###\s*)?(?:(\d+)[\.:\)]\s*|\*?\*?Bước\s*(\d+)[\.:\)]?\*?\*?\s*)(.*)$/i
            );
            if (numHeaderMatch) {
              const num = numHeaderMatch[1] || numHeaderMatch[2];
              const title = numHeaderMatch[3];
              return (
                <div key={idx} className="flex items-start gap-2.5 pt-1.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-[#046a4e] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {num}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h4 className="font-bold text-slate-900 text-[13px]">{renderInline(title)}</h4>
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
              return <hr key={idx} className="border-slate-100 my-1.5" />;
            }

            // 4. Đoạn văn thường
            return (
              <p key={idx} className="text-slate-700 leading-relaxed">
                {renderInline(trimmed)}
              </p>
            );
          })}
        </div>

        {/* Hộp Khuyến nghị nổi bật (Callout Box) */}
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
        {refs.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
            <span className="font-medium text-slate-500">Căn cứ pháp lý:</span>
            {refs.map((ref, idx) => (
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

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  onSelectPromptChip,
  onResetChat,
  onExportPdf,
  onShareChat,
  onSettingsClick,
  onAttachFile,
  onCaptureCamera,
  onVoiceInput,
  isAiTyping = false,
  isLoadingHistory = false,
}) => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Khởi tạo tên viết tắt người dùng
  const userInitials = useMemo(() => {
    if (!user?.fullName) return 'HN';
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user?.fullName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col h-full min-h-[760px] overflow-hidden">
      {/* 1. Chatbot Top Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        {/* Left Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                ThuTra AI - Trợ lý Luật Thuế TNCN
              </h2>
              <span className="bg-emerald-50 text-[#046a4e] border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                v3.5 Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              Hệ thống giải đáp chuyên sâu các trường hợp làm song song, freelance vãng lai và tối ưu hoàn thuế.
            </p>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          {/* Nút Làm mới hội thoại */}
          <button
            onClick={onResetChat}
            title="Bắt đầu phiên hội thoại mới"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm mới</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            <span>Xuất PDF</span>
          </button>

          {/* Settings / Filters */}
          <button
            onClick={onSettingsClick}
            title="Thư viện pháp luật & quy định"
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Share */}
          <button
            onClick={onShareChat}
            title="Chia sẻ phiên tư vấn"
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Chat Scroll Container */}
      <div ref={scrollRef} className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/40">
        {/* Loading Indicator khi đồng bộ lịch sử từ CSDL PostgreSQL */}
        {isLoadingHistory && (
          <div className="flex items-center justify-center py-3 text-slate-500 gap-2 text-xs bg-white border border-slate-200/80 rounded-xl shadow-2xs animate-in fade-in">
            <Sparkles className="w-4 h-4 text-[#046a4e] animate-spin" />
            <span>Đang đồng bộ lịch sử tư vấn pháp lý từ tài khoản...</span>
          </div>
        )}

        {/* Quick Prompt Chips */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Gợi ý câu hỏi phổ biến cho kỳ quyết toán thuế TNCN:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mockPromptChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => onSelectPromptChip(chip)}
                className="bg-white hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-300 rounded-xl px-3 py-2 text-left text-xs text-slate-700 transition-all shadow-2xs flex items-center gap-2 cursor-pointer group"
              >
                <span className="text-sm shrink-0">{chip.icon}</span>
                <span className="truncate group-hover:text-emerald-900 font-medium">
                  {chip.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lời chào mở đầu nếu chưa có tin nhắn trong phiên */}
        {messages.length === 0 && !isLoadingHistory && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Building2 className="w-4 h-4 text-emerald-100" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 max-w-2xl space-y-3 shadow-2xs">
              <p className="text-xs text-slate-700 leading-relaxed">
                Xin chào quý khách{user?.fullName ? ` (${user.fullName})` : ''}! Tôi là{' '}
                <strong className="text-slate-900 font-bold">Trợ lý Pháp lý ThuTra AI</strong>. Tôi sẵn
                sàng hỗ trợ rà soát các hợp đồng làm song song, mức trích nộp 10%, tra cứu người phụ
                thuộc và phương án quyết toán trực tiếp tối ưu nhất cho kỳ tính thuế này.
              </p>

              <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-2.5 px-3 flex items-start gap-2 text-[11px] text-slate-600">
                <ShieldCheck className="w-4 h-4 text-[#046a4e] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Dữ liệu trao đổi được bảo mật chuẩn tài chính và lưu trữ an toàn trong tài khoản của bạn. Bạn có thể đặt câu hỏi hoặc chọn các chủ đề gợi ý phía trên.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg) => {
          // A. User Message
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex flex-col items-end space-y-1">
                <div className="flex items-start gap-2.5 max-w-xl">
                  <div className="bg-[#0F172A] text-white text-xs sm:text-[13px] rounded-2xl rounded-tr-xs p-3.5 px-4 shadow-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#046a4e] text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-emerald-500/20 shadow-xs mt-0.5">
                    {userInitials}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 pr-10 font-mono">
                  <span>Đã gửi {msg.timestamp}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>
            );
          }

          // B. AI Assistant Card (Live & Synchronized from PostgreSQL)
          return (
            <AssistantCard
              key={msg.id}
              text={msg.text || ''}
              timestamp={msg.timestamp}
              legalRefsOverride={msg.legalReferences}
            />
          );
        })}

        {/* AI Typing Indicator */}
        {isAiTyping && (
          <div className="flex items-start gap-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4 text-emerald-100 animate-pulse" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 px-4 shadow-2xs flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-[#046a4e] animate-spin" />
              <span>ThuTra AI đang phân tích dữ liệu &amp; tra cứu quy định pháp luật...</span>
              <span className="flex gap-1 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-200"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Chat Input Bar */}
      <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
        <ChatInputBar
          onSendMessage={onSendMessage}
          onAttachFile={onAttachFile}
          onCaptureCamera={onCaptureCamera}
          onVoiceInput={onVoiceInput}
          disabled={isAiTyping}
        />
      </div>
    </div>
  );
};
