import React, { useState, useEffect, useRef } from 'react';
import { Step3Header } from './Step3Header';
import { TaxRefundBanner } from './TaxRefundBanner';
import { RuleEngineWarnings } from './RuleEngineWarnings';
import { AiTaxOptimizationCard } from './AiTaxOptimizationCard';
import { ExportXmlSection } from './ExportXmlSection';
import { TaxSummarySidebar } from './TaxSummarySidebar';
import { Step3Footer } from './Step3Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useTaxFiling } from '../../contexts/TaxFilingContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  AddDependentMstModal, 
  EtaxSubmissionModal, 
  TaxSubmissionModal,
  TaxSettlementSuccessModal 
} from './Step3Modals';

interface WizardStep3PageProps {
  onBackToStep2?: () => void;
  onGoToStep1?: () => void;
  onBackToDashboard?: () => void;
  onStepClick?: (step: number) => void;
}

export const WizardStep3Page: React.FC<WizardStep3PageProps> = ({
  onBackToStep2,
  onGoToStep1,
  onBackToDashboard,
  onStepClick
}) => {
  const { user } = useAuth();
  const { toast, clearAllToasts } = useToast();
  const { activeProfile, latestAuditResult, executeAudit } = useTaxFiling();
  const [isAddMstOpen, setIsAddMstOpen] = useState(false);
  const [isEtaxSubmitOpen, setIsEtaxSubmitOpen] = useState(false);
  const [isTaxSubmissionOpen, setIsTaxSubmissionOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Cờ ref lưu trữ profileId đã hoàn tất audit để chặn lặp vô hạn và chống React 18 Strict Mode
  const hasAuditedRef = useRef<string | null>(null);
  const profileId = activeProfile?.id;

  // Tự động kích hoạt kiểm tra 15 rules từ Backend (chạy DUY NHẤT 1 LẦN cho mỗi profileId)
  useEffect(() => {
    if (!profileId || hasAuditedRef.current === profileId) {
      return;
    }

    hasAuditedRef.current = profileId;

    executeAudit()
      .then((res) => {
        clearAllToasts();
        if (res.findings && res.findings.length > 0) {
          toast.info(
            `✓ Thẩm tra hoàn tất: Ghi nhận ${res.findings.length} điểm lưu ý cần rà soát.`,
            undefined,
            3000
          );
        } else {
          toast.success(
            '✓ Thẩm tra hoàn tất: Hồ sơ hợp lệ 15/15 rules, đủ điều kiện hoàn thuế!',
            undefined,
            3000
          );
        }
      })
      .catch((err: unknown) => {
        console.warn('Lỗi khi kích hoạt thẩm tra 15 rules:', err);
      });
  }, [profileId]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900 flex flex-col justify-between">
      <div>
        {/* 1. Top Header Bar & Stepper */}
        <Step3Header
          onLogoClick={onBackToDashboard}
          onSaveDraft={onBackToDashboard}
          onHotlineClick={() => alert('Hotline hỗ trợ pháp lý TNCN: 1900 6868')}
          onStepClick={(step) => {
            if (step === 1 && onGoToStep1) onGoToStep1();
            if (step === 2 && onBackToStep2) onBackToStep2();
            if (onStepClick) onStepClick(step);
          }}
        />

        {/* 2. Main Content Body */}
        <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (Main Results, Rules, AI Optimization, Export XML) ~65% */}
            <div className="lg:col-span-8 space-y-4">
              {/* Part 1: Tax Refund Verdict & Authority Locator */}
              <TaxRefundBanner />

              {/* Part 2: Rule Engine Scanner (R10 High Risk & R01 Amber Warning) */}
              <RuleEngineWarnings
                onOpenRuleDetail={(ruleId) => {
                  alert(`Chi tiết điều chỉnh ${ruleId}: Tự động loại bỏ trùng lặp tháng 5 & 6, giữ nguyên 12 tháng giảm trừ tại Công ty CP Công nghệ ABC.`);
                }}
                onAddDependentMst={() => setIsAddMstOpen(true)}
              />

              {/* Part 3: AI Tax Optimizer */}
              <AiTaxOptimizationCard
                onApplyOptimization={() => {
                  alert('Đã áp dụng phương án tối ưu thuế của Trợ lý AI vào Tờ khai 02/QTT!');
                }}
              />

              {/* Part 4: Export XML & Express Submission Guide */}
              <ExportXmlSection
                onDownloadXml={() => {
                  toast.success('✓ Xuất tờ khai 02/QTT-TNCN chuẩn XML thành công! Sẵn sàng nộp Tổng cục Thuế.');
                  setIsTaxSubmissionOpen(true);
                }}
                onWatchVideoGuide={() => setIsTaxSubmissionOpen(true)}
                onDownloadSchedule={() => {
                  toast.info('Đang tải Tờ Bảng kê chi tiết 02-1/BK-TNCN...');
                }}
                onDownloadPdfReport={() => {
                  toast.info('Đang tải Phiếu tổng hợp số liệu giải trình quyết toán thuế PDF...');
                }}
              />
            </div>

            {/* Right Column (Sidebar Summary & Legal Safety) ~35% */}
            <div className="lg:col-span-4">
              <TaxSummarySidebar />
            </div>
          </div>
        </main>
      </div>

      {/* 3. Bottom Sticky Action Bar */}
      <Step3Footer
        onBackStep={onBackToStep2}
        onSubmitEtax={() => setIsSuccessModalOpen(true)}
      />

      {/* Modals */}
      <AddDependentMstModal
        isOpen={isAddMstOpen}
        onClose={() => setIsAddMstOpen(false)}
      />

      <EtaxSubmissionModal
        isOpen={isEtaxSubmitOpen}
        onClose={() => setIsEtaxSubmitOpen(false)}
        onCompleteToDashboard={onBackToDashboard}
      />

      <TaxSubmissionModal
        isOpen={isTaxSubmissionOpen}
        onClose={() => setIsTaxSubmissionOpen(false)}
        taxOffice={activeProfile?.taxDepartmentName || user?.taxDepartmentName || 'Cục Thuế TP Hồ Chí Minh'}
        fileName={`to-khai-02-QTT-TNCN-${activeProfile?.taxYear || 2025}-${user?.mst || '8492019482'}.xml`}
      />

      <TaxSettlementSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        settlementId={`TT-${activeProfile?.taxYear || 2025}-${user?.mst || '8492019482'}-QTT`}
        refundAmount={latestAuditResult?.calculation?.taxRefund ?? (activeProfile?.financialSummary?.taxBalance && activeProfile.financialSummary.taxBalance > 0 ? activeProfile.financialSummary.taxBalance : 0)}
        taxOffice={activeProfile?.taxDepartmentName || user?.taxDepartmentName || 'Cục Thuế TP Hồ Chí Minh'}
        onDownloadPdf={() => alert('Đang tải bản tổng hợp giải trình quyết toán thuế (PDF)...')}
        onGoToDashboard={onBackToDashboard}
      />
    </div>
  );
};
