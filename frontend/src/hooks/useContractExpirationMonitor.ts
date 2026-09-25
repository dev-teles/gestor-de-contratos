import { useEffect, useRef, useState, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Contract, NotificationItem } from '../types';
import {
  checkContractsExpiration,
  calculateDaysRemaining,
  isContractExpiringSoon,
  buildExpirationNotification,
} from '../utils/contractMonitor';

export interface UseContractExpirationMonitorOptions {
  contracts: Contract[];
  setNotifications: Dispatch<SetStateAction<NotificationItem[]>>;
  enabled?: boolean;
  thresholdDays?: number; // default: 30
  checkIntervalMs?: number; // default: 60000 (1 minute)
  onNotificationSent?: (notification: NotificationItem) => void;
}

export interface UseContractExpirationMonitorReturn {
  expiringContracts: Contract[];
  expiringCount: number;
  checkExpirationsNow: () => void;
  monitorContract: (contract: Contract) => boolean;
  lastCheckedAt: Date | null;
}

/**
 * Custom hook that monitors contract expiration dates and triggers notifications
 * for any contract that has less than `thresholdDays` (default 30 days) until expiration.
 */
export function useContractExpirationMonitor({
  contracts,
  setNotifications,
  enabled = true,
  thresholdDays = 30,
  checkIntervalMs = 60000,
  onNotificationSent,
}: UseContractExpirationMonitorOptions): UseContractExpirationMonitorReturn {
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  // Keep references to prevent stale closures in intervals
  const contractsRef = useRef(contracts);
  contractsRef.current = contracts;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const thresholdDaysRef = useRef(thresholdDays);
  thresholdDaysRef.current = thresholdDays;

  const onNotificationSentRef = useRef(onNotificationSent);
  onNotificationSentRef.current = onNotificationSent;

  // Primary verification function
  const runExpirationCheck = useCallback(() => {
    if (!enabledRef.current) {
      setExpiringContracts([]);
      return;
    }

    let newlyAddedNotifs: NotificationItem[] = [];
    let detectedExpiring: Contract[] = [];

    setNotifications((prevNotifications) => {
      const result = checkContractsExpiration(
        contractsRef.current,
        prevNotifications,
        {
          thresholdDays: thresholdDaysRef.current,
          enabled: enabledRef.current,
        }
      );

      newlyAddedNotifs = result.newlyAdded;
      detectedExpiring = result.expiringContracts;

      return result.updatedNotifications;
    });

    setExpiringContracts(detectedExpiring);
    setLastCheckedAt(new Date());

    // Trigger callback for any new notifications
    if (newlyAddedNotifs.length > 0 && onNotificationSentRef.current) {
      newlyAddedNotifs.forEach((notif) => {
        onNotificationSentRef.current?.(notif);
      });
    }
  }, [setNotifications]);

  // Monitor a single contract (e.g. after user adds or updates one)
  const monitorContract = useCallback(
    (contract: Contract): boolean => {
      if (!enabledRef.current) return false;

      if (isContractExpiringSoon(contract, thresholdDaysRef.current)) {
        const days = calculateDaysRemaining(contract);
        const newNotif = buildExpirationNotification(contract, days);
        let wasAdded = false;

        setNotifications((prev) => {
          const alreadyExists = prev.some(
            (n) =>
              (n.type === 'expiracao' && n.contractCode === contract.code) ||
              n.id === newNotif.id
          );
          if (alreadyExists) return prev;

          wasAdded = true;
          return [newNotif, ...prev];
        });

        if (wasAdded && onNotificationSentRef.current) {
          onNotificationSentRef.current(newNotif);
        }

        // Update list of expiring contracts
        setExpiringContracts((prev) => {
          if (!prev.some((c) => c.id === contract.id)) {
            return [contract, ...prev];
          }
          return prev;
        });

        return true;
      }
      return false;
    },
    [setNotifications]
  );

  // Run on mount and whenever the contracts array reference or enabled state changes
  useEffect(() => {
    runExpirationCheck();
  }, [contracts, enabled, runExpirationCheck]);

  // Periodic check interval
  useEffect(() => {
    if (!enabled || checkIntervalMs <= 0) return;

    const timer = setInterval(() => {
      runExpirationCheck();
    }, checkIntervalMs);

    return () => clearInterval(timer);
  }, [enabled, checkIntervalMs, runExpirationCheck]);

  return {
    expiringContracts,
    expiringCount: expiringContracts.length,
    checkExpirationsNow: runExpirationCheck,
    monitorContract,
    lastCheckedAt,
  };
}
