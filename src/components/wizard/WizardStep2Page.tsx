import React, { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { StepHeader } from './StepHeader';
import { OcrUploader, type OcrExtractedResult } from './OcrUploader';
import { IncomeSourceItemCard } from './IncomeSourceItemCard';
import { RealtimeTaxSidebar } from './RealtimeTaxSidebar';
import { WizardFooter } from './WizardFooter';
import { 
  ViewScanModal, 
  RuleEngineCheckModal,
  type ViewScanModalProps
} from './WizardModals';
import { RuleEngineScanningModal } from './RuleEngineScanningModal';
import { IncomeFormModal, type IncomeFormData, type IncomeCategory } from '../modals/IncomeFormModal';

import { useTaxFiling } from '../../contexts/TaxFilingContext';
import { useToast } from '../../contexts/ToastContext';
import type { IncomeSourceDto } from '../../types/business.types';

interface WizardStep2PageProps {
  onBackToStep1?: () => void;
  onProceedToStep3?: () => void;
  onBackToDashboard?: () => void;
  onStepClick?: (step: number) => void;
}

export const WizardStep2Page: React.FC<WizardStep2PageProps> = ({
  onBackToStep1,
  onProceedToStep3,
  onBackToDashboard,
  onStepClick
}) => {
  const { toast } = useToast();
  const { 
    activeProfile, 
    incomeSources, 
    addIncomeSource, 
    updateIncomeSource, 
    removeIncomeSource, 
    executeAudit, 
    createNewProfile 
  } = useTaxFiling();

  // Modal States
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSourceDto | null>(null);
  const [modalInitialData, setModalInitialData] = useState<Partial<IncomeFormData> | null>(null);

  // Scan modal & Rule Engine
  const [isViewScanOpen, setIsViewScanOpen] = useState(false);
  const [scanModalProps, setScanModalProps] = useState<Partial<ViewScanModalProps>>({});
  const [isRuleEngineOpen, setIsRuleEngineOpen] = useState(false);
  const [isScanningRules, setIsScanningRules] = useState(false);

  // Mở modal thêm mới thủ công
  const handleOpenAddManual = () => {
    setEditingSource(null);
    setModalInitialData(null);
    setIsIncomeModalOpen(true);
  };

  // Mở modal chỉnh sửa nguồn thu nhập hiện có
  const handleOpenEdit = (source: IncomeSourceDto) => {
    setEditingSource(source);
    const category: IncomeCategory = source.category === 'salary_contract' 
      ? 'labor' 
      : source.category === 'freelance_10pct' 
        ? 'freelance' 
        : 'labor';

    setModalInitialData({
      id: source.id,
      category,
      companyName: source.payerName,
      taxCode: source.payerMst,
      totalIncome: Number(source.totalTaxableIncome || source.totalIncomeGross || 0),
      taxWithheld: Number(source.taxWithheld || 0),
      insuranceDeduction: Number(source.insuranceDeduction || 0),
      applyPersonalDeduction: Boolean(source.applyPersonalDeduction),
    });
    setIsIncomeModalOpen(true);
  };

  // Xóa nguồn thu nhập khỏi cơ sở dữ liệu
  const handleDeleteSource = async (id: string, payerName: string) => {
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa nguồn thu nhập "${payerName}" khỏi cơ sở dữ liệu?`
    );
    if (!isConfirmed) return;

    try {
      await removeIncomeSource(id);
      toast.success('✓ Đã xóa nguồn thu nhập thành công khỏi cơ sở dữ liệu.', payerName);
    } catch (err: unknown) {
      console.error('Lỗi khi xóa nguồn thu nhập:', err);
      toast.error('Không thể xóa nguồn thu nhập.', 'Vui lòng kiểm tra lại kết nối.');
    }
  };

  // Xem bản scan chứng từ
  const handleViewScan = (source?: IncomeSourceDto) => {
    if (source) {
      setScanModalProps({
        fileName: source.eCertificateCode ? `Chung_tu_${source.payerMst}.pdf` : 'Chung_Tu_Khau_Tru_2024.pdf',
        payerName: source.payerName,
        payerMst: source.payerMst,
        grossIncome: Number(source.totalTaxableIncome || source.totalIncomeGross || 0),
        taxWithheld: Number(source.taxWithheld || 0),
      });
    } else {
      setScanModalProps({
        fileName: 'Chung_Tu_Khau_Tru_2024.pdf',
        payerName: 'Công ty Cổ phần Công nghệ ABC',
        payerMst: '0312345678',
        grossIncome: 180000000,
        taxWithheld: 14200000,
      });
    }
    setIsViewScanOpen(true);
  };

  // Xử lý sau khi quét OCR chứng từ thành công
  const handleOcrScanSuccess = (extracted: OcrExtractedResult) => {
    toast.success(
      '✓ Quét OCR chứng từ thành công!', 
      `Bóc tách: ${extracted.companyName} (${new Intl.NumberFormat('vi-VN').format(extracted.totalIncome)} VNĐ)`
    );

    // Mở modal xác nhận với dữ liệu đã điền sẵn từ OCR
    setEditingSource(null);
    setModalInitialData({
      category: 'labor',
      companyName: extracted.companyName,
      taxCode: extracted.taxCode,
      totalIncome: extracted.totalIncome,
      taxWithheld: extracted.taxWithheld,
      insuranceDeduction: extracted.insuranceDeduction || Math.round(extracted.totalIncome * 0.105),
      applyPersonalDeduction: true,
    });
    setScanModalProps({
      fileName: extracted.fileName,
      payerName: extracted.companyName,
      payerMst: extracted.taxCode,
      grossIncome: extracted.totalIncome,
      taxWithheld: extracted.taxWithheld,
    });
    setIsIncomeModalOpen(true);
  };

  // Lưu thông tin nguồn thu nhập vào PostgreSQL
  const handleSaveIncome = async (formData: IncomeFormData) => {
    try {
      let targetProfileId = activeProfile?.id;
      if (!targetProfileId) {
        const created = await createNewProfile(2025, '105', 'Cục Thuế TP Hồ Chí Minh');
        targetProfileId = created.id;
      }

      const category = formData.category === 'labor' 
        ? 'salary_contract' 
        : formData.category === 'freelance' 
          ? 'freelance_10pct' 
          : 'other';

      if (editingSource) {
        // Cập nhật nguồn thu nhập có sẵn
        await updateIncomeSource(editingSource.id, {
          category,
          payerName: formData.companyName,
          payerMst: formData.taxCode,
          totalIncomeGross: formData.totalIncome,
          totalTaxableIncome: formData.totalIncome,
          taxWithheld: formData.taxWithheld,
          insuranceDeduction: formData.category === 'labor' ? (formData.insuranceDeduction || 0) : 0,
          applyPersonalDeduction: formData.applyPersonalDeduction,
        });

        toast.success(
          '✓ Đã cập nhật nguồn thu nhập thành công!',
          `${formData.companyName} (${new Intl.NumberFormat('vi-VN').format(formData.totalIncome)} VNĐ)`
        );
      } else {
        // Thêm nguồn thu nhập mới
        await addIncomeSource({
          profileId: targetProfileId,
          category,
          payerName: formData.companyName,
          payerMst: formData.taxCode,
          totalIncomeGross: formData.totalIncome,
          totalTaxableIncome: formData.totalIncome,
          taxWithheld: formData.taxWithheld,
          insuranceDeduction: formData.category === 'labor' ? (formData.insuranceDeduction || 0) : 0,
          applyPersonalDeduction: formData.applyPersonalDeduction,
        });

        toast.success(
          '✓ Đã lưu nguồn thu nhập mới vào cơ sở dữ liệu!',
          `${formData.companyName} (${new Intl.NumberFormat('vi-VN').format(formData.totalIncome)} VNĐ)`
        );
      }

      setIsIncomeModalOpen(false);
      setEditingSource(null);
      setModalInitialData(null);
    } catch (err: unknown) {
      console.error('Lỗi lưu nguồn thu nhập:', err);
      toast.error('Không thể lưu nguồn thu nhập.', 'Vui lòng kiểm tra lại thông tin.');
    }
  };

  // Kích hoạt thẩm tra Rule Engine trước khi qua Bước 3
  const handleStartRuleEngineCheck = async () => {
    if (incomeSources.length === 0) {
      toast.error('Chưa có nguồn thu nhập nào', 'Vui lòng thêm ít nhất một nguồn thu nhập trước khi tiếp tục.');
      return;
    }

    toast.success('✓ Bắt đầu thẩm tra Rule Engine và đối soát dữ liệu thuế.');
    setIsScanningRules(true);
    try {
      if (activeProfile?.id) {
        await executeAudit();
      }
    } catch (err: unknown) {
      console.warn('Cảnh báo Audit:', err);
    }
  };

  const handleRuleEngineComplete = () => {
    setIsScanningRules(false);
    if (onProceedToStep3) {
      onProceedToStep3();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900 flex flex-col justify-between">
      <div>
        {/* 1. Header with Top identification and Stepper */}
        <StepHeader
          onLogoClick={onBackToDashboard}
          onSaveDraft={() => {
            toast.success('✓ Đã lưu nháp tiến độ quyết toán an toàn.');
            if (onBackToDashboard) onBackToDashboard();
          }}
          onHotlineClick={() => alert('Tổng đài hỗ trợ pháp lý TNCN: 1900 6868 (8:00 - 18:00)')}
          onStepClick={(step) => {
            if (step === 1 && onBackToStep1) onBackToStep1();
            if (step === 3) {
              handleStartRuleEngineCheck();
            }
            if (onStepClick) onStepClick(step);
          }}
        />

        {/* 2. Main Content Body */}
        <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (~65% width) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Smart OCR Upload Box */}
              <OcrUploader
                onScanSuccess={handleOcrScanSuccess}
                onViewScan={() => handleViewScan()}
                onOpenMobileCamera={() => {
                  alert('Vui lòng quét mã QR trên màn hình bằng ứng dụng eTax Mobile');
                }}
              />

              {/* Section: Danh mục nguồn thu nhập */}
              <div className="pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                      Các nguồn thu nhập chịu thuế đã nhận
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hệ thống đồng bộ trực tiếp từ PostgreSQL và phân loại tự động HĐLĐ lũy tiến và vãng lai khấu trừ 10%.
                    </p>
                  </div>

                  <span className="bg-slate-100 text-slate-600 border border-slate-200/80 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 self-start sm:self-center">
                    {incomeSources.length} Nguồn thu nhập
                  </span>
                </div>

                {/* Empty State or Dynamic List of Cards */}
                {incomeSources.length === 0 ? (
                  <div className="py-12 px-6 border border-dashed border-slate-200 rounded-2xl bg-white shadow-2xs flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                      <Wallet className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Chưa có nguồn thu nhập nào được ghi nhận
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5 leading-relaxed">
                      Hãy tải lên chứng từ khấu trừ thuế TNCN hoặc bấm thêm nguồn thu nhập từ Hợp đồng lao động, vãng lai để hệ thống tính toán chi tiết.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddManual}
                      className="bg-[#046a4e] hover:bg-[#03543e] active:scale-[0.99] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Thêm nguồn thu nhập đầu tiên</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Render dynamic list of cards from PostgreSQL */}
                    {incomeSources.map((source) => (
                      <IncomeSourceItemCard
                        key={source.id}
                        source={source}
                        onEdit={handleOpenEdit}
                        onDelete={handleDeleteSource}
                        onViewScan={() => handleViewScan(source)}
                      />
                    ))}

                    {/* Add Manual Source Button */}
                    <button
                      type="button"
                      onClick={handleOpenAddManual}
                      className="w-full bg-white hover:bg-slate-50 border-2 border-dashed border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-[#046a4e] text-xs font-semibold py-3 px-4 rounded-2xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#046a4e]" />
                      <span>Thêm nguồn thu nhập thủ công (Hợp đồng khác / Cho thuê tài sản / Đầu tư vốn)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (~35% width): Realtime Tax Calculation from DB */}
            <div className="lg:col-span-4">
              <RealtimeTaxSidebar
                onViewTaxFormula={() => setIsRuleEngineOpen(true)}
              />
            </div>
          </div>
        </main>
      </div>

      {/* 3. Bottom Navigation Footer */}
      <WizardFooter
        onBackStep={() => {
          if (onBackToStep1) onBackToStep1();
          else alert('Quay lại Bước 1: Khai báo người phụ thuộc');
        }}
        onNextStep={handleStartRuleEngineCheck}
      />

      {/* Modals */}
      <IncomeFormModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditingSource(null);
          setModalInitialData(null);
        }}
        initialData={modalInitialData}
        onSave={handleSaveIncome}
      />

      <ViewScanModal
        isOpen={isViewScanOpen}
        onClose={() => setIsViewScanOpen(false)}
        {...scanModalProps}
      />

      <RuleEngineCheckModal
        isOpen={isRuleEngineOpen}
        onClose={() => setIsRuleEngineOpen(false)}
      />

      {/* 1.5s Intermediate Rule Engine Scanning Modal */}
      <RuleEngineScanningModal
        isOpen={isScanningRules}
        onComplete={handleRuleEngineComplete}
      />
    </div>
  );
};
