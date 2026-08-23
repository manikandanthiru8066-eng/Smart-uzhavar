import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MachineryActivityItem } from '../hooks/useMachineryActivity';
import { Tractor, Users, X, ArrowRight } from 'lucide-react';

interface MachineryToastProps {
  notification: MachineryActivityItem | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const MachineryToast: React.FC<MachineryToastProps> = ({
  notification,
  onDismiss,
  autoDismissMs = 9000,
}) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [notification, onDismiss, autoDismissMs]);

  if (!notification) return null;

  const handleJoin = () => {
    onDismiss();
    navigate('/machinery');
  };

  const name = notification.farmerName || 'A farmer';
  const machine = notification.machineType || 'Machinery';
  const block = notification.block || notification.village || 'your block';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-bounce-short fade-in">
      <div className="bg-surface border-2 border-emerald-500/80 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md">
        {/* Header with Icon and Close */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Tractor size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {isTa ? 'அருகிலுள்ள செயல்பாடு' : 'Nearby Booking'}
              </span>
              <span className="text-[11px] text-ink-faint ml-2 font-mono">
                {notification.timeAgo}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-ink-faint hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-2 cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Message body */}
        <p className="text-xs font-semibold text-ink leading-snug">
          {isTa
            ? `${name} ${block} வட்டாரத்தில் ஒரு ${machine} முன்பதிவு செய்துள்ளார் — இணைந்து பயன்படுத்தலாமா?`
            : `${name} just booked a ${machine} in ${block} — pool together?`}
        </p>

        {/* Action button */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/60">
          <button
            type="button"
            onClick={handleJoin}
            className="btn btn-primary btn-sm w-full justify-center flex items-center gap-1.5 cursor-pointer text-xs font-bold py-1.5"
          >
            <Users size={14} />
            <span>{isTa ? 'குழுவில் இணைய / பார்க்க' : 'View / Pool Together'}</span>
            <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="btn btn-ghost btn-sm text-xs px-2.5 py-1.5 cursor-pointer shrink-0"
          >
            {isTa ? 'மூடு' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};
