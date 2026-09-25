import type { Dispatch, SetStateAction } from 'react';
import { Contract, NotificationItem } from '../types';

/**
 * Calculates the number of remaining days for a contract.
 * Checks both `contract.endDate` against the reference date and `contract.remainingDays`.
 */
export function calculateDaysRemaining(
  contract: Pick<Contract, 'endDate' | 'remainingDays' | 'status'>,
  referenceDate: Date = new Date()
): number {
  if (contract.status === 'expirado') {
    return 0;
  }

  // 1. Check if contract has an explicit remainingDays property
  const explicitDays = contract.remainingDays;
  const hasExplicitDays = typeof explicitDays === 'number' && !isNaN(explicitDays);

  // 2. Try calculating from contract.endDate
  if (contract.endDate) {
    const end = new Date(contract.endDate);
    if (!isNaN(end.getTime())) {
      const ref = new Date(referenceDate);
      ref.setHours(0, 0, 0, 0);
      const target = new Date(end);
      target.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - ref.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // If diffDays is in the future (> 0), use it
      if (diffDays > 0) {
        // If contract has an explicit remainingDays that is also valid and smaller, prefer it
        if (hasExplicitDays && explicitDays >= 0 && explicitDays < diffDays) {
          return explicitDays;
        }
        return diffDays;
      }

      // If diffDays is today or in the past, contract is due or expired
      return 0;
    }
  }

  // Fallback to explicit remainingDays if available
  if (hasExplicitDays) {
    return explicitDays;
  }

  return 999;
}

/**
 * Returns true if a contract is expiring in less than `thresholdDays` (default: 30) and is not already expired.
 */
export function isContractExpiringSoon(
  contract: Contract,
  thresholdDays: number = 30,
  referenceDate: Date = new Date()
): boolean {
  if (contract.status === 'expirado') {
    return false;
  }
  const days = calculateDaysRemaining(contract, referenceDate);
  return days > 0 && days < thresholdDays;
}

/**
 * Builds a standardized NotificationItem for an expiring contract.
 */
export function buildExpirationNotification(
  contract: Contract,
  daysRemaining: number
): NotificationItem {
  const isUrgent = daysRemaining <= 15;
  const supplierLabel = contract.supplierName ? ` (${contract.supplierName})` : '';

  return {
    id: `notif-exp-${contract.id}`,
    title: `Vencimento Próximo: ${contract.title || contract.code}`,
    description: `Faltam ${daysRemaining} dias para o término da vigência deste instrumento contratual${supplierLabel}. Inicie as tratativas de renovação, renegociação de tarifas ou encerramento.`,
    timeAgo: 'Agora',
    type: 'expiracao',
    contractCode: contract.code,
    read: false,
    urgent: isUrgent,
    badgeText: `${daysRemaining} dias restantes`,
    actionText: 'Ver contrato →',
  };
}

export interface ExpirationCheckResult {
  updatedNotifications: NotificationItem[];
  newlyAdded: NotificationItem[];
  expiringContracts: Contract[];
}

/**
 * Scans contracts and returns updated notifications array with new expiration alerts.
 * Avoids duplicate notifications by checking `contractCode` and `type: 'expiracao'`.
 */
export function checkContractsExpiration(
  contracts: Contract[],
  currentNotifications: NotificationItem[],
  options?: {
    thresholdDays?: number;
    referenceDate?: Date;
    enabled?: boolean;
  }
): ExpirationCheckResult {
  const thresholdDays = options?.thresholdDays ?? 30;
  const referenceDate = options?.referenceDate ?? new Date();
  const enabled = options?.enabled ?? true;

  if (!enabled) {
    return {
      updatedNotifications: currentNotifications,
      newlyAdded: [],
      expiringContracts: [],
    };
  }

  const expiringContracts: Contract[] = [];
  const newlyAdded: NotificationItem[] = [];

  // Index existing notifications by contractCode for fast lookup
  const existingExpCodes = new Set(
    currentNotifications
      .filter((n) => n.type === 'expiracao' && n.contractCode)
      .map((n) => n.contractCode)
  );

  const existingIds = new Set(currentNotifications.map((n) => n.id));

  for (const contract of contracts) {
    if (isContractExpiringSoon(contract, thresholdDays, referenceDate)) {
      expiringContracts.push(contract);

      const expectedId = `notif-exp-${contract.id}`;
      const alreadyNotified =
        existingExpCodes.has(contract.code) || existingIds.has(expectedId);

      if (!alreadyNotified) {
        const days = calculateDaysRemaining(contract, referenceDate);
        const notification = buildExpirationNotification(contract, days);
        newlyAdded.push(notification);
        existingExpCodes.add(contract.code);
        existingIds.add(expectedId);
      }
    }
  }

  // Prepend newly added alerts to notifications list
  const updatedNotifications = newlyAdded.length > 0
    ? [...newlyAdded, ...currentNotifications]
    : currentNotifications;

  return {
    updatedNotifications,
    newlyAdded,
    expiringContracts,
  };
}

/**
 * Utility function to immediately verify a contract and dispatch a notification if expiring soon.
 */
export function dispatchContractExpirationNotice(
  contract: Contract,
  setNotifications: Dispatch<SetStateAction<NotificationItem[]>>,
  thresholdDays: number = 30
): boolean {
  if (!isContractExpiringSoon(contract, thresholdDays)) {
    return false;
  }

  const days = calculateDaysRemaining(contract);
  const newNotification = buildExpirationNotification(contract, days);

  setNotifications((prev) => {
    // Avoid duplicates
    const alreadyExists = prev.some(
      (n) =>
        (n.type === 'expiracao' && n.contractCode === contract.code) ||
        n.id === newNotification.id
    );
    if (alreadyExists) {
      return prev;
    }
    return [newNotification, ...prev];
  });

  return true;
}
