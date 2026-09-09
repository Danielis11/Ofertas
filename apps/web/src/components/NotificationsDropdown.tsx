import React, { useRef, useEffect } from 'react';
import {
  Bell,
  TrendingDown,
  Flame,
  Heart,
  Info,
  CheckCheck,
  Trash2,
  BellRing,
  X,
  ExternalLink,
} from 'lucide-react';
import { AppNotification } from '../lib/useNotifications';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  hasDesktopPermission: boolean;
  onRequestDesktopPermission: () => Promise<boolean>;
  onSelectNotificationDeal?: (dealId: string) => void;
}

export const NotificationsDropdown: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  hasDesktopPermission,
  onRequestDesktopPermission,
  onSelectNotificationDeal,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'PRICE_DROP':
        return <TrendingDown className="w-4 h-4 text-emerald-600" />;
      case 'SUPER_DEAL':
        return <Flame className="w-4 h-4 text-orange-600" />;
      case 'FAVORITE_ALERT':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Justo ahora';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in-50 zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-bold text-slate-900">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-600 text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="Marcar todas como leídas"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Limpiar todas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop permission banner */}
      {!hasDesktopPermission && (
        <div className="px-3.5 py-2.5 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px] text-amber-900 font-medium leading-tight">
              Recibe alertas de bajadas de precio al instante
            </span>
          </div>
          <button
            onClick={onRequestDesktopPermission}
            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shrink-0 transition-colors"
          >
            Activar
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
              <Bell className="w-5 h-5 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Sin notificaciones pendientes</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Te avisaremos en cuanto detectemos bajadas de precio o super deals.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                onMarkAsRead(notif.id);
                if (notif.dealId && onSelectNotificationDeal) {
                  onSelectNotificationDeal(notif.dealId);
                }
              }}
              className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                !notif.read ? 'bg-orange-50/30' : 'bg-white'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatTime(notif.timestamp)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                  {notif.message}
                </p>

                {notif.price && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                        maximumFractionDigits: 0,
                      }).format(notif.price)}
                    </span>
                    {notif.savingsPercentage && notif.savingsPercentage > 0 && (
                      <span className="text-[10px] font-bold text-rose-600">
                        -{notif.savingsPercentage}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
