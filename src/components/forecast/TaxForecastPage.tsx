import React, { useState } from 'react';
import { TaxForecastBanner } from './TaxForecastBanner';
import { IncomeStreamList } from './IncomeStreamList';
import { DocumentUploadBox } from './DocumentUploadBox';
import { DeadlineWidget } from './DeadlineWidget';
import { RiskAlertWidget } from './RiskAlertWidget';
import { AiAssistantWidget } from './AiAssistantWidget';
import { FooterTrustBadges } from './FooterTrustBadges';
import { 
  CalculationFormulaModal, 
  FixRiskModal, 
  AiChatModal 
} from './ForecastModals';
import type { IncomeStreamItem, AiPrompt } from '../../data/mockForecastData';

interface TaxForecastPageProps {
  onNavigateToDashboard?: () => void;
  onNavigateToStep1?: () => void;
  onNavigateToStep2?: () => void;
  onNavigateToStep3?: () => void;
  onNavigateToChatbot?: () => void;
}

export const TaxForecastPage: React.FC<TaxForecastPageProps> = ({ 
  onNavigateToStep1,
  onNavigateToChatbot
}) => {
  // Modals state
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');

  const handleSelectAiPrompt = (prompt: AiPrompt) => {
    setAiQuestion(prompt.question);
    setIsAiModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Hero Forecast Card */}
      <TaxForecastBanner
          onStartSettlement={() => {
            if (onNavigateToStep1) onNavigateToStep1();
            else alert('Bắt đầu quy trình quyết toán 3 bước tự động...');
          }}
          onViewFormula={() => setIsFormulaModalOpen(true)}
          onOpenEtaxPortal={() => {
            alert('Đang kết nối cổng Dịch vụ công Quốc gia & eTax Mobile...');
          }}
        />

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (Nguồn thu nhập & Upload - ~65% width) */}
          <div className="lg:col-span-8 space-y-4">
            <IncomeStreamList
              onAddIncomeClick={() => {
                alert('Mở form thêm nguồn thu nhập mới...');
              }}
              onUploadRequiredClick={(item: IncomeStreamItem) => {
                alert(`Tải lên chứng từ bổ sung cho nguồn: ${item.companyName}`);
              }}
              onViewXmlClick={(item: IncomeStreamItem) => {
                alert(`Đang mở xem chi tiết chứng từ XML: ${item.companyName}`);
              }}
            />

            {/* Drag & Drop Upload Zone */}
            <DocumentUploadBox
              onFileSelect={(file) => {
                alert(`Đã nhận chứng từ: ${file.name}`);
              }}
              onSyncEtaxMobile={() => {
                alert('Đang gửi yêu cầu đồng bộ eTax Mobile...');
              }}
            />
          </div>

          {/* Right Column (Widgets: Deadline, Risk Alert, AI Assistant - ~35% width) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Widget 1: Deadline Counter */}
            <DeadlineWidget
              onOpenGuide={() => {
                alert('Mở cẩm nang hướng dẫn quyết toán nhanh trong 15 phút');
              }}
            />

            {/* Widget 2: Risk Alert Rule Engine */}
            <RiskAlertWidget
              onFixRisk={() => setIsRiskModalOpen(true)}
            />

            {/* Widget 3: Mini AI Chatbot */}
            <AiAssistantWidget
              onSelectPrompt={handleSelectAiPrompt}
              onOpenFullChat={() => {
                if (onNavigateToChatbot) {
                  onNavigateToChatbot();
                } else {
                  setAiQuestion('');
                  setIsAiModalOpen(true);
                }
              }}
            />
          </div>
        </div>

        {/* 3. Footer Trust Badges & Copyright */}
        <FooterTrustBadges />

      {/* Interactive Modals */}
      <CalculationFormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
      />

      <FixRiskModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
      />

      <AiChatModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialQuestion={aiQuestion}
      />
    </div>
  );
};
