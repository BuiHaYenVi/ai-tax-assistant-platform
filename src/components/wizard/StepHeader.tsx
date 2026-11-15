import React from 'react';
import { 
  Headphones, 
  Bookmark, 
  Check, 
  FileSpreadsheet,
  Layers,
  Sparkles
} from 'lucide-react';

interface StepHeaderProps {
  onSaveDraft?: () => void;
  onHotlineClick?: () => void;
  onStepClick?: (step: number) => void;
  onLogoClick?: () => void;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  onSaveDraft,
  onHotlineClick,
  onStepClick
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-3 mb-4">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-800 text-xs sm:text-sm">
            Quy trình quyết toán 3 bước • Bước 2: Thu nhập &amp; Chứng từ
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

      {/* 2. Stepper 3-Step Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Step 1: Completed */}
            <div
              onClick={() => onStepClick && onStepClick(1)}
              className="rounded-xl p-2.5 px-3 border border-slate-200/80 bg-slate-50/60 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#046a4e] text-white flex items-center justify-center shrink-0">
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
                <p className="text-[10px] text-slate-400 truncate">
                  • Đã xác thực CCCD
                </p>
              </div>
            </div>

            {/* Step 2: Active (Viền xanh lá đậm) */}
            <div
              onClick={() => onStepClick && onStepClick(2)}
              className="rounded-xl p-2.5 px-3 border-2 border-[#046a4e] bg-white shadow-xs flex items-center gap-3 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#046a4e] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#046a4e] uppercase tracking-wider">
                    BƯỚC 2 • ĐANG THỰC HIỆN
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-semibold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-700" />
                    <span>Bóc tách số liệu</span>
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-xs truncate">
                  Thu nhập &amp; Chứng từ khấu trừ
                </h4>
                <p className="text-[10px] text-slate-500 truncate">
                  Đã tải 2 chứng từ điện tử
                </p>
              </div>
            </div>

            {/* Step 3: Pending */}
            <div
              onClick={() => onStepClick && onStepClick(3)}
              className="rounded-xl p-2.5 px-3 border border-slate-200/80 bg-white opacity-70 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    BƯỚC 3
                  </span>
                </div>
                <h4 className="font-semibold text-slate-700 text-xs truncate">
                  Kiểm tra lỗi &amp; Xuất hồ sơ
                </h4>
                <p className="text-[10px] text-slate-400 truncate">
                  Chạy Rule Engine &amp; ký số XML
                </p>
              </div>
            </div>
          </div>
    </div>
  );
};
