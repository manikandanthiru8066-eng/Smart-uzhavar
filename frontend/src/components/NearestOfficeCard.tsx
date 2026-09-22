import React, { useState, useEffect } from 'react';
import { subsidyApi } from '../api/client';
import { MapPin, Phone, Navigation, Building2, MapPinOff, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NearestOfficeCardProps {
  blockId?: number | null;
  blockName?: string | null;
  districtName?: string | null;
}

interface OfficeDetails {
  id: number;
  blockId?: number | null;
  districtName: string;
  blockName: string;
  officeName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  source?: string | null;
  verificationNote?: string | null;
}

export const NearestOfficeCard: React.FC<NearestOfficeCardProps> = ({
  blockId,
  blockName,
  districtName,
}) => {
  const { t } = useTranslation();
  const [office, setOffice] = useState<OfficeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOffice = async () => {
      if (!blockId && !blockName) {
        setOffice(null);
        setHasChecked(true);
        return;
      }

      setLoading(true);
      try {
        let res;
        if (blockId) {
          try {
            res = await subsidyApi.get<OfficeDetails>(`/api/blocks/${blockId}/office`);
          } catch (err: any) {
            // If blockId fails (e.g. temporary urban ID), try by blockName
            if (blockName) {
              const query = districtName
                ? `/api/blocks/office?district=${encodeURIComponent(districtName)}&block=${encodeURIComponent(blockName)}`
                : `/api/blocks/office?block=${encodeURIComponent(blockName)}`;
              res = await subsidyApi.get<OfficeDetails>(query);
            } else {
              throw err;
            }
          }
        } else if (blockName) {
          const query = districtName
            ? `/api/blocks/office?district=${encodeURIComponent(districtName)}&block=${encodeURIComponent(blockName)}`
            : `/api/blocks/office?block=${encodeURIComponent(blockName)}`;
          res = await subsidyApi.get<OfficeDetails>(query);
        }

        if (isMounted) {
          if (res && res.data && (res.data.officeName || res.data.address)) {
            setOffice(res.data);
          } else {
            setOffice(null);
          }
          setHasChecked(true);
        }
      } catch (err) {
        if (isMounted) {
          setOffice(null);
          setHasChecked(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOffice();

    return () => {
      isMounted = false;
    };
  }, [blockId, blockName, districtName]);

  if (!blockName && !blockId) {
    return null;
  }

  // Google Maps direction URL computation
  const getDirectionsUrl = () => {
    if (office?.latitude && office?.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${office.latitude},${office.longitude}`;
    }
    const queryParts = [office?.address || office?.officeName || `${blockName} Agriculture Office`];
    if (districtName) queryParts.push(districtName);
    queryParts.push('Tamil Nadu');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(', '))}`;
  };

  return (
    <div className="card p-4 my-3 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/50 border border-emerald-200/90 rounded-2xl shadow-xs hover:shadow-sm transition-all">
      <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Building2 size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 leading-tight">Nearest Agriculture Office</h4>
            <span className="text-[11px] text-emerald-800 font-medium">
              Block: <strong>{blockName || 'Your Block'}</strong> {districtName ? `(${districtName})` : ''}
            </span>
          </div>
        </div>

        {office?.latitude && office?.longitude && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
            <MapPin size={10} /> GPS Verified
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-4 flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium">
          <Loader2 size={16} className="animate-spin" />
          <span>Locating nearest block agriculture office...</span>
        </div>
      ) : office && (office.officeName || office.address) ? (
        <div className="space-y-2.5 text-xs text-gray-700">
          <div>
            <div className="font-bold text-gray-900 text-sm">{office.officeName || 'Block Agriculture Extension Centre'}</div>
            {office.address && (
              <div className="flex items-start gap-1.5 mt-1 text-gray-600">
                <MapPin size={14} className="shrink-0 text-emerald-700 mt-0.5" />
                <span>{office.address}</span>
              </div>
            )}
          </div>

          {office.phone && (
            <div className="flex items-center gap-2 pt-0.5 text-gray-700">
              <Phone size={13} className="text-emerald-700 shrink-0" />
              <span className="font-semibold">Phone:</span>
              <a
                href={`tel:${office.phone.replace(/[^0-9+]/g, '')}`}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline transition-colors"
              >
                {office.phone}
              </a>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-100/70 mt-2">
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              id="get-directions-btn"
            >
              <Navigation size={13} /> Get Directions
            </a>

            {office.source && (
              <span className="text-[10px] text-gray-400">
                Source: {office.source.includes('nic.in') ? 'District Portal' : 'TN Agrisnet'}
              </span>
            )}
          </div>
        </div>
      ) : hasChecked ? (
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <MapPinOff size={16} className="shrink-0 text-amber-700 mt-0.5" />
          <div>
            <div className="font-semibold">Office location not available for your block yet</div>
            <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
              Contact your District Collectorate Agriculture Department or visit the nearest Agricultural Extension Centre for on-ground scheme submission.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
