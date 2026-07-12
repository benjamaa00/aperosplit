import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { CONFIG } from '@/config';

export function useRealtimeSync({
  enabled = true,
  onDataChange,
}: {
  enabled?: boolean;
  onDataChange?: () => void;
}) {
  const utils = trpc.useUtils();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataHashRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !CONFIG.ENABLE_REALTIME_SYNC) {
      return;
    }

    const syncData = async () => {
      try {
        // Invalidate and refetch group data
        await utils.equilibra.getGroupData.invalidate();
        
        // Calculate a simple hash of the data to detect changes
        const data = utils.equilibra.getGroupData.getData();
        if (data) {
          const currentHash = JSON.stringify(data);
          if (currentHash !== lastDataHashRef.current) {
            lastDataHashRef.current = currentHash;
            onDataChange?.();
          }
        }
      } catch (error) {
        console.error('[RealtimeSync] Sync failed:', error);
      }
    };

    // Initial sync
    syncData();

    // Set up polling interval
    intervalRef.current = setInterval(syncData, CONFIG.SYNC_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, utils, onDataChange]);

  return {
    sync: () => {
      utils.equilibra.getGroupData.invalidate();
    },
  };
}
