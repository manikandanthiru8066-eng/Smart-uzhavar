import { useState, useEffect, useRef } from 'react';
import { insuranceApi } from '../api/client';

export interface MachineryActivityItem {
  id: number;
  farmerName: string;
  farmerUsername?: string;
  machineType: string;
  district?: string;
  block?: string;
  blockId?: number;
  village?: string;
  acres?: number;
  requiredDate?: string;
  createdAt: string;
  timeAgo: string;
}

interface UseMachineryActivityOptions {
  block?: string;
  blockId?: number;
  district?: string;
  enabled?: boolean;
  pollIntervalMs?: number; // default 15000 (15 seconds)
}

export function useMachineryActivity({
  block,
  blockId,
  district,
  enabled = true,
  pollIntervalMs = 15000,
}: UseMachineryActivityOptions) {
  const [latestNotification, setLatestNotification] = useState<MachineryActivityItem | null>(null);
  const [activities, setActivities] = useState<MachineryActivityItem[]>([]);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const isFirstFetchRef = useRef<boolean>(true);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const fetchActivity = async () => {
      try {
        const params: Record<string, any> = {};
        if (blockId) params.blockId = blockId;
        if (block) params.block = block;
        if (district) params.district = district;

        const res = await insuranceApi.get('/api/machinery/nearby-activity', { params });
        if (!isMounted || !Array.isArray(res.data)) return;

        const newItems: MachineryActivityItem[] = res.data;
        setActivities(newItems);

        if (isFirstFetchRef.current) {
          // On initial load, record all existing IDs as seen
          newItems.forEach((item) => seenIdsRef.current.add(item.id));
          isFirstFetchRef.current = false;
        } else {
          // Detect genuinely new items
          const freshItems = newItems.filter((item) => !seenIdsRef.current.has(item.id));
          if (freshItems.length > 0) {
            // Show the newest booking
            setLatestNotification(freshItems[0]);
            // Add all new IDs to seen set
            freshItems.forEach((item) => seenIdsRef.current.add(item.id));
          }
        }
      } catch (err) {
        // Silently handle polling errors
        console.debug('Nearby machinery activity poll error:', err);
      }
    };

    // Initial fetch immediately
    fetchActivity();

    // Poll every 15 seconds
    const intervalId = setInterval(fetchActivity, pollIntervalMs);

    // Clean up on component unmount
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [block, blockId, district, enabled, pollIntervalMs]);

  const dismissNotification = () => {
    setLatestNotification(null);
  };

  return {
    latestNotification,
    activities,
    dismissNotification,
  };
}
