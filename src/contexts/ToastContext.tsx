// ==============================================================================
// Hệ thống Thông báo & Nhật ký Hoạt động Toàn cục (Toast & Notification Center)
// Hệ thống: ThuTra TNCN - UX Feedback & Activity Log Layer
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  timestamp: string;
  createdAt: number;
  read: boolean;
}

export interface ToastContextType {
  toast: {
    success: (message: string, description?: string, duration?: number) => void;
    error: (message: string, description?: string, duration?: number) => void;
    warning: (message: string, description?: string, duration?: number) => void;
    info: (message: string, description?: string, duration?: number) => void;
  };
  showToast: (message: string, type?: ToastType, description?: string) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  // Quản lý Nhật ký Thông báo (Notification Center)
  notifications: SystemNotification[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const NOTIFICATIONS_STORAGE_KEY = 'thutra_notifications_history';

/**
 * Định dạng thời gian thân thiện (Vừa xong, x phút trước hoặc HH:mm DD/MM)
 */
export function formatNotificationTime(date: Date = new Date()): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}`;
}

const INITIAL_MOCK_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'init-1',
    title: 'Hồ sơ quyết toán kỳ 2025 đã sẵn sàng',
    message: 'Hệ thống đã chuẩn bị sẵn tờ khai mẫu 02/QTT-TNCN cho kỳ tính thuế hiện hành.',
    type: 'info',
    timestamp: 'Hôm nay',
    createdAt: Date.now() - 3600000,
    read: true,
  },
  {
    id: 'init-2',
    title: 'Đồng bộ Rule Engine thành công',
    message: '15/15 quy tắc kiểm tra logic thuế theo TT 111/2013 và NQ 954/2020 đã được nạp.',
    type: 'success',
    timestamp: 'Hôm nay',
    createdAt: Date.now() - 7200000,
    read: true,
  },
];

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Khởi tạo danh sách thông báo từ localStorage
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Không thể đọc lịch sử thông báo từ localStorage:', e);
    }
    return INITIAL_MOCK_NOTIFICATIONS;
  });

  // Tự động lưu thông báo vào localStorage khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Không thể lưu thông báo vào localStorage:', e);
    }
  }, [notifications]);

  // Tính số lượng thông báo chưa đọc
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    } catch {}
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Hàm thêm Toast và TỰ ĐỘNG GHI NHẬN VÀO NHẬT KÝ THÔNG BÁO
  const addToast = useCallback((type: ToastType, message: string, description?: string, duration = 3800) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = {
      id,
      type,
      message,
      description,
      duration,
    };

    setToasts((prev) => [...prev.slice(-3), newToast]); // Tối đa 4 toasts nổi trên màn hình

    // Tự động đẩy vào Danh sách Thông báo (Notification Center)
    const newNotification: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: message,
      message: description || message,
      type,
      timestamp: formatNotificationTime(new Date()),
      createdAt: Date.now(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 49)]); // Giữ tối đa 50 thông báo gần nhất

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toastMethods = useMemo(() => ({
    success: (message: string, description?: string, duration?: number) => {
      addToast('success', message, description, duration);
    },
    error: (message: string, description?: string, duration?: number) => {
      addToast('error', message, description, duration);
    },
    warning: (message: string, description?: string, duration?: number) => {
      addToast('warning', message, description, duration);
    },
    info: (message: string, description?: string, duration?: number) => {
      addToast('info', message, description, duration);
    },
  }), [addToast]);

  const showToast = useCallback((message: string, type: ToastType = 'success', description?: string) => {
    addToast(type, message, description);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{
      toast: toastMethods,
      showToast,
      removeToast,
      clearAllToasts,
      notifications,
      unreadCount,
      markAllAsRead,
      markAsRead,
      clearNotifications,
    }}>
      {children}

      {/* Global Toast Floating Container (Góc trên bên phải) */}
      <div 
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none select-none px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="alert"
            className={`
              pointer-events-auto transform transition-all duration-300 ease-out
              animate-in fade-in slide-in-from-top-4 sm:slide-in-from-right-4
              flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-xl
              ${
                item.type === 'success'
                  ? 'bg-white/95 backdrop-blur-md border-emerald-200 text-slate-800 shadow-emerald-950/10'
                  : item.type === 'error'
                  ? 'bg-white/95 backdrop-blur-md border-rose-200 text-slate-800 shadow-rose-950/10'
                  : item.type === 'warning'
                  ? 'bg-white/95 backdrop-blur-md border-amber-200 text-slate-800 shadow-amber-950/10'
                  : 'bg-white/95 backdrop-blur-md border-blue-200 text-slate-800 shadow-blue-950/10'
              }
            `}
            style={{
              borderLeftWidth: '5px',
              borderLeftColor:
                item.type === 'success'
                  ? '#046a4e'
                  : item.type === 'error'
                  ? '#e11d48'
                  : item.type === 'warning'
                  ? '#d97706'
                  : '#2563eb',
            }}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#046a4e] border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#046a4e]" />
                </div>
              )}
              {item.type === 'error' && (
                <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
              )}
              {item.type === 'warning' && (
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
              )}
              {item.type === 'info' && (
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <h5 className="text-xs sm:text-[13px] font-bold text-slate-800 leading-snug">
                {item.message}
              </h5>
              {item.description && (
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Alias thuận tiện cho các component quản lý Notification Center
export const useNotifications = useToast;
