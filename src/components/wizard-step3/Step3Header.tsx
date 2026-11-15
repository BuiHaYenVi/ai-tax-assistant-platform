import React from 'react';
import { 
  Bookmark, 
  Headphones, 
  Check 
} from 'lucide-react';
import { useTaxFiling } from '../../contexts/TaxFilingContext';

interface Step3HeaderProps {
  onSaveDraft?: () => void;
  onHotlineClick?: () => void;
  onStepClick?: (step: number) => void;
  onLogoClick?: () => void;
}

export const Step3Header: React.FC<Step3HeaderProps> = ({
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
            Quy trình quyết toán 3 bước • Bước 3: Xuất hồ sơ &amp; eTax (Kỳ thuế {activeProfile?.taxYear || 2025})
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Step 1: Completed */}
            <div
              onClick={() => onStepClick && onStepClick(1)}
              className="rounded-xl p-2.5 px-3 border border-slate-200/80 bg-slate-50/60 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    BƯỚC 1
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-semibold px-1.5 py-0.2 rounded-full">
                    1 NPT hợp lệ
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs truncate">
                  Người phụ thuộc &amp; Bản thân
                </h4>
              </div>
            </div>

            {/* Step 2: Completed */}
            <div
              onClick={() => onStepClick && onStepClick(2)}
              className="rounded-xl p-2.5 px-3 border border-slate-200/80 bg-slate-50/60 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    BƯỚC 2
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-semibold px-1.5 py-0.2 rounded-full">
                    2 chứng từ đã đối soát
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs truncate">
                  Thu nhập &amp; Chứng từ khấu trừ
                </h4>
              </div>
            </div>

            {/* Step 3: ACTIVE (Viền xanh lá đậm) */}
            <div
              onClick={() => onStepClick && onStepClick(3)}
              className="rounded-xl p-2.5 px-3 border-2 border-[#046a4e] bg-white shadow-xs flex items-center gap-3 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#046a4e] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                3
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#046a4e] uppercase tracking-wider">
                    BƯỚC 3 (HIỆN TẠI)
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                    15 Rules Scanner - Hoàn thuế
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-xs truncate">
                  Kiểm tra lỗi &amp; Xuất hồ sơ
                </h4>
              </div>
            </div>
          </div>
    </div>
  );
};
