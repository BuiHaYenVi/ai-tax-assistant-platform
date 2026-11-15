// ==============================================================================
// Trang Hỗ trợ Pháp lý TNCN (Tax Legal Consultation Page)
// Hệ thống: ThuTra TNCN - Đồng bộ CSDL PostgreSQL & Trực tiếp Gemini AI
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { ChatArea, type ChatAreaMessage } from './ChatArea';
import { SyncedProfileSidebar } from './SyncedProfileSidebar';
import { LegalReferenceCard } from './LegalReferenceCard';
import { ExportPdfModal, LegalLibraryModal, AttachDocumentModal } from './TaxChatModals';
import type { PromptChip, LegalDocument } from '../../data/mockChatData';
import { chatApi, type ChatHistoryItem } from '../../services/chat.api';
import { useAuth } from '../../contexts/AuthContext';

interface TaxChatPageProps {
  onNavigateToOverview?: () => void;
  onNavigateToIncomes?: () => void;
  onNavigateToSettlementStep3?: () => void;
}

export const TaxChatPage: React.FC<TaxChatPageProps> = ({
  onNavigateToSettlementStep3,
}) => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatAreaMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Modals state
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [isLegalLibraryOpen, setIsLegalLibraryOpen] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocument | null>(null);
  const [isAttachDocOpen, setIsAttachDocOpen] = useState(false);

  // 1. Tự động đồng bộ lịch sử phiên hội thoại từ CSDL PostgreSQL khi mở trang
  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      if (!isAuthenticated) return;
      try {
        setIsLoadingHistory(true);
        const res = await chatApi.getHistory();
        if (isMounted && res.success && res.data?.messages) {
          const mapped: ChatAreaMessage[] = res.data.messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            legalReferences: m.legalReferences,
            timestamp: m.timestamp,
          }));
          setMessages(mapped);
        }
      } catch (err) {
        console.warn('[TaxChatPage] Không thể tải lịch sử tư vấn từ server:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // 2. Gửi tin nhắn thực tế đến Backend & Gemini Flash
  const handleSendMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || isAiTyping) return;

    const userMsg: ChatAreaMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsAiTyping(true);

    try {
      const chatHistory: ChatHistoryItem[] = updated
        .slice(0, -1)
        .slice(-10)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.text || '' }],
        }));

      const res = await chatApi.ask({
        message: cleanText,
        history: chatHistory,
      });

      if (res.success && res.data?.reply) {
        const botReply: ChatAreaMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: res.data.reply,
          legalReferences: res.data.legalReferences || [],
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botReply]);
      }
    } catch (err) {
      console.error('[TaxChatPage] Lỗi gửi câu hỏi:', err);
      const fallbackError: ChatAreaMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: 'Rất tiếc, đã có sự cố kết nối tới Trợ lý AI. Bạn vui lòng kiểm tra lại đường truyền mạng hoặc thử lại sau giây lát nhé.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackError]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // 3. Chọn Prompt chip nhanh
  const handleSelectPromptChip = (chip: PromptChip) => {
    handleSendMessage(chip.query);
  };

  // 4. Làm mới phiên hội thoại (gọi API tạo conversation mới trên PostgreSQL)
  const handleResetChat = async () => {
    try {
      if (isAuthenticated) {
        await chatApi.reset();
      }
    } catch (err) {
      console.warn('[TaxChatPage] Lỗi khi tạo phiên mới trên server:', err);
    } finally {
      setMessages([]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Chatbot Area (~68%) */}
        <div className="lg:col-span-8">
              <ChatArea
                messages={messages}
                onSendMessage={handleSendMessage}
                onSelectPromptChip={handleSelectPromptChip}
                onResetChat={handleResetChat}
                onExportPdf={() => setIsExportPdfOpen(true)}
                onShareChat={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Đã sao chép liên kết phiên tư vấn pháp lý AI vào bộ nhớ tạm!');
                }}
                onSettingsClick={() => setIsLegalLibraryOpen(true)}
                onAttachFile={() => setIsAttachDocOpen(true)}
                onCaptureCamera={() => setIsAttachDocOpen(true)}
                onVoiceInput={() =>
                  alert('Chức năng nhận diện giọng nói đang được hoàn thiện trong phiên bản tới.')
                }
                isAiTyping={isAiTyping}
                isLoadingHistory={isLoadingHistory}
              />
            </div>

            {/* Right Column: Synced Profile & Legal References (~32%) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Card 1: Hồ sơ đang đồng bộ */}
              <SyncedProfileSidebar onOpenSettlementForm={onNavigateToSettlementStep3} />

              {/* Card 2: Văn bản Pháp luật áp dụng */}
              <LegalReferenceCard
                onViewAll={() => {
                  setSelectedLegalDoc(null);
                  setIsLegalLibraryOpen(true);
                }}
                onSelectDoc={(doc) => {
                  setSelectedLegalDoc(doc);
                  setIsLegalLibraryOpen(true);
                }}
              />
            </div>
          </div>

      {/* 3. Interactive Modals */}
      <ExportPdfModal isOpen={isExportPdfOpen} onClose={() => setIsExportPdfOpen(false)} />

      <LegalLibraryModal
        isOpen={isLegalLibraryOpen}
        onClose={() => {
          setIsLegalLibraryOpen(false);
          setSelectedLegalDoc(null);
        }}
        selectedDoc={selectedLegalDoc}
      />

      <AttachDocumentModal isOpen={isAttachDocOpen} onClose={() => setIsAttachDocOpen(false)} />
    </div>
  );
};
