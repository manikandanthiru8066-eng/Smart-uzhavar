import React from 'react';
import { useTranslation } from 'react-i18next';
import { TranslatedText } from '../components/TranslatedText';
import { TriangleAlert, HandCoins, ShieldCheck, Tractor } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="page-view fade-in">
      <div className="page-hd">
        <h1>{t('notificationsPageTitle')}</h1>
        <p>{t('notificationsPageSub')}</p>
      </div>

      <div className="notif-row card">
        <div className="n-ic" style={{ background: 'var(--rust-soft)', color: 'var(--rust)' }}>
          <TriangleAlert size={18} />
        </div>
        <div>
          <b className="text-sm"><TranslatedText text="Heavy rain expected tomorrow in Thiruvaiyaru block" /></b>
          <p className="text-xs text-gray-500 mt-1"><TranslatedText text="Avoid fertilizer application until conditions clear." /></p>
          <div className="n-time">{t('time2HoursAgo')}</div>
        </div>
      </div>

      <div className="notif-row card">
        <div className="n-ic" style={{ background: 'var(--light-green-soft)', color: 'var(--emerald-deep)' }}>
          <HandCoins size={18} />
        </div>
        <div>
          <b className="text-sm"><TranslatedText text="New subsidy scheme matches your profile" /></b>
          <p className="text-xs text-gray-500 mt-1"><TranslatedText text="Farm Mechanization Subsidy is now open for Thanjavur district." /></p>
          <div className="n-time">{t('timeYesterday')}</div>
        </div>
      </div>

      <div className="notif-row card">
        <div className="n-ic" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>
          <ShieldCheck size={18} />
        </div>
        <div>
          <b className="text-sm"><TranslatedText text="Insurance enrollment deadline in 14 days" /></b>
          <p className="text-xs text-gray-500 mt-1"><TranslatedText text="PMFBY Kharif window closes on 30 July." /></p>
          <div className="n-time">{t('time2DaysAgo')}</div>
        </div>
      </div>

      <div className="notif-row card">
        <div className="n-ic" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
          <Tractor size={18} />
        </div>
        <div>
          <b className="text-sm"><TranslatedText text="A tractor is now available nearby" /></b>
          <p className="text-xs text-gray-500 mt-1"><TranslatedText text="Your machinery group in Thiruvaiyaru reached its threshold." /></p>
          <div className="n-time">{t('time3DaysAgo')}</div>
        </div>
      </div>
    </div>
  );
};
