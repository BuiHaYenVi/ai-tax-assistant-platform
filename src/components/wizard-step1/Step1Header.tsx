import React from 'react';
import { 
  Headphones, 
  Bookmark, 
  Users, 
  FileText, 
  Send 
} from 'lucide-react';
import { useTaxFiling } from '../../contexts/TaxFilingContext';

interface Step1HeaderProps {
  dependentCount?: number;
  onSaveDraft?: () => void;
  onHotlineClick?: () => void;
  onStepClick?: (step: number) => void;
  onLogoClick?: () => void;
}

export const Step1Header: React.FC<Step1HeaderProps> = ({
  dependentCount = 1,
  onSaveDraft,
  onHotlineClick,
  onStepClick
}) => {
  const { activeProfile } = useTaxFiling();

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-3 mb-4">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-800 text-xs sm:text-sm">
            Quy trình quyết toán 3 bước • Kỳ tính thuế {activeProfile?.taxYear || 2025}
          </span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onHotlineClick && (
            <button
              type="button"
              onClick={onHotlineClick}
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer text-xs"
            >
              <Headphones className="w-3.5 h-3.5 text-slate-500" />
              <span>Hotline <strong>1900 6886</strong></span>
            </button>
          )}
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer text-xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Lưu nháp &amp; Thoát</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Stepper 3 Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: ACTIVE (Viền xanh lá đậm) */}
          <div
            onClick={() => onStepClick && onStepClick(1)}
            className="rounded-2xl p-3 px-4 border-2 border-[#046a4e] bg-white shadow-xs flex items-center gap-3.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5 text-emerald-100" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#046a4e] uppercase tracking-wider">
                  BƯỚC 1 • ĐANG THỰC HIỆN
                </span>
                <span className="bg-[#046a4e] text-white text-[9px] font-bold px-2 py-0.2 rounded-full shadow-2xs">
                  {dependentCount} NPT hợp lệ
                </span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate mt-0.5">
                Người phụ thuộc &amp; Bản thân
              </h4>
            </div>
          </div>

          {/* Step 2: Next step (Mờ) */}
          <div
            onClick={() => onStepClick && onStepClick(2)}
            className="rounded-2xl p-3 px-4 border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 flex items-center gap-3.5 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-500 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                BƯỚC 2
              </span>
              <h4 className="font-bold text-slate-700 text-xs sm:text-sm truncate mt-0.5">
                Thu nhập &amp; Chứng từ khấu trừ
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                Tải chứng từ e-Chungtu
              </p>
            </div>
          </div>

          {/* Step 3: Next step (Mờ) */}
          <div
            onClick={() => onStepClick && onStepClick(3)}
            className="rounded-2xl p-3 px-4 border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 flex items-center gap-3.5 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-500 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                BƯỚC 3
              </span>
              <h4 className="font-bold text-slate-700 text-xs sm:text-sm truncate mt-0.5">
                Kiểm tra lỗi &amp; Xuất hồ sơ
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                Chạy Rule Engine &amp; Ký số XML
              </p>
            </div>
          </div>
        </div>
    </div>
  );
};
