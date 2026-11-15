// ==============================================================================
// Dropdown Danh sách Thông báo & Nhật ký Hoạt động (Notification Dropdown)
// Hệ thống: ThuTra TNCN - Giao diện Header Notification Popover
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCheck, 
  Trash2, 
  Clock, 
  BellOff,
  Bell
} from 'lucide-react';
import { useNotifications } from '../../contexts/ToastContext';
import type { SystemNotification } from '../../contexts/ToastContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, unreadCount, markAllAsRead, markAsRead, clearNotifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-84 sm:w-96 max-h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* 1. Header Popover */}
      <div className="p-3.5 px-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#046a4e] border border-emerald-200/80 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Thông báo &amp; Nhật ký</span>
              {unreadCount > 0 && (
                <span className="bg-emerald-100 text-[#046a4e] text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-200">
                  {unreadCount} mới
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="p-1.5 text-slate-500 hover:text-[#046a4e] hover:bg-emerald-50 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Đánh dấu tất cả là đã đọc"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đã đọc</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử thông báo?')) {
                  clearNotifications();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Xóa toàn bộ lịch sử thông báo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xóa</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Notification List */}
      <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100 text-xs">
        {notifications.length === 0 ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
              <BellOff className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Chưa có thông báo mới nào</p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">
              Các sự kiện thao tác quyết toán, lưu hồ sơ và kết quả thẩm tra sẽ được ghi nhận tại đây.
            </p>
          </div>
        ) : (
          notifications.map((item: SystemNotification) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`
                p-3.5 px-4 flex items-start gap-3 transition-colors cursor-pointer relative
                ${!item.read ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'bg-white hover:bg-slate-50/80'}
              `}
            >
              {/* Type Icon */}
              <div className="shrink-0 mt-0.5">
                {item.type === 'success' && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#046a4e] border border-emerald-200 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#046a4e]" />
                  </div>
                )}
                {item.type === 'error' && (
                  <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                )}
                {item.type === 'warning' && (
                  <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                )}
                {item.type === 'info' && (
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-1">
                  <h5 className={`text-xs leading-snug line-clamp-1 ${!item.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {item.title}
                  </h5>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                  )}
                </div>

                {item.message && item.message !== item.title && (
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                )}

                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                  <Clock className="w-3 h-3 text-slate-300" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Footer Bar */}
      <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Nhật ký thời gian thực</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer hover:underline"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
