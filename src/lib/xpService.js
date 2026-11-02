import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

/**
 * TASKBAR OS / NEURAL OS — AUTHORITATIVE PROGRESSION & XP ECONOMY SERVICE
 * 
 * Mathematical Model:
 * Cumulative threshold function:
 *   thresholdForLevel(L) = L <= 1 ? 0 : Math.round(250 * (L^2 - L))
 * 
 * Thresholds:
 *   Level 1: 0 XP
 *   Level 2: 500 XP       (Δ = 500)
 *   Level 3: 1,500 XP     (Δ = 1,000)
 *   Level 4: 3,000 XP     (Δ = 1,500)
 *   Level 5: 5,000 XP     (Δ = 2,000)
 *   ...
 *   Level 10: 22,500 XP
 *   Level 20: 95,000 XP
 *   Level 50: 612,500 XP
 *   Level 75: 1,387,500 XP
 */

export const RANKS = [
  { minLvl: 1,  maxLvl: 4,   title: 'Recruit',       color: '#94a3b8', badge: '🔰', name: 'Recruit' },
  { minLvl: 5,  maxLvl: 9,   title: 'Operative',     color: '#38bdf8', badge: '⚡', name: 'Operative' },
  { minLvl: 10, maxLvl: 19,  title: 'Specialist',    color: '#818cf8', badge: '⚔️', name: 'Specialist' },
  { minLvl: 20, maxLvl: 34,  title: 'Vanguard',      color: '#a855f7', badge: '🛡️', name: 'Vanguard' },
  { minLvl: 35, maxLvl: 49,  title: 'Elite',         color: '#fb7185', badge: '👑', name: 'Elite' },
  { minLvl: 50, maxLvl: 74,  title: 'Neural Master', color: '#facc15', badge: '🏆', name: 'Neural Master' },
  { minLvl: 75, maxLvl: 9999, title: 'Transcendent',  color: '#ec4899', badge: '🌌', name: 'Transcendent' },
];

/**
 * Returns rank metadata object for a given level.
 */
export const getRankForLevel = (lvl) => {
  const levelNum = Math.max(1, Math.floor(Number(lvl) || 1));
  return RANKS.find(r => levelNum >= r.minLvl && levelNum <= r.maxLvl) || RANKS[RANKS.length - 1];
};

/**
 * Total lifetime cumulative XP required to achieve level L.
 * Deterministic, monotonically increasing, with zero-boundary protection.
 */
export const thresholdForLevel = (lvl) => {
  const levelNum = Math.floor(Number(lvl) || 1);
  if (levelNum <= 1) return 0;
  return Math.round(250 * (Math.pow(levelNum, 2) - levelNum));
};

// Backwards-compatibility alias
export const getXpForLevel = thresholdForLevel;

/**
 * Calculates current level, level thresholds, progress %, remaining XP, and rank details.
 * Prevents division by zero, negative XP, and off-by-one errors.
 * 
 * @param {number} xp - Lifetime accumulated XP
 * @returns {Object} Complete level progression profile
 */
export const calculateLevelInfo = (xp = 0) => {
  const currentXp = Math.max(0, Math.floor(Number(xp) || 0));
  let currentLvl = 1;

  // Determine current level via cumulative thresholds
  while (currentXp >= thresholdForLevel(currentLvl + 1)) {
    currentLvl++;
    if (currentLvl >= 9999) break; // Circuit breaker
  }

  const currentRank = RANKS.find(r => currentLvl >= r.minLvl && currentLvl <= r.maxLvl) || RANKS[RANKS.length - 1];
  const currentLevelThreshold = thresholdForLevel(currentLvl);
  const nextLevelThreshold = thresholdForLevel(currentLvl + 1);
  const xpInCurrentLevel = currentXp - currentLevelThreshold;
  const xpSpanForNextLevel = Math.max(1, nextLevelThreshold - currentLevelThreshold);
  const progressPct = Math.min(100, Math.max(0, (xpInCurrentLevel / xpSpanForNextLevel) * 100));
  const remainingXp = Math.max(0, nextLevelThreshold - currentXp);

  return {
    level: currentLvl,
    rank: currentRank.title,
    title: currentRank.title,
    rankBadge: currentRank.badge,
    rankColor: currentRank.color,
    lifetimeXp: currentXp,
    totalXp: currentXp,
    currentLevelThreshold,
    currentLevelXp: currentLevelThreshold,
    nextLevelThreshold,
    nextLevelXp: nextLevelThreshold,
    xpIntoLevel: xpInCurrentLevel,
    xpInCurrentLevel,
    xpForNextLevel: xpSpanForNextLevel,
    xpSpanForNextLevel,
    remainingXp,
    progress: Math.round(progressPct * 10) / 10,
    progressPct: Math.round(progressPct * 10) / 10,
  };
};

// Backwards-compatibility alias
export const calculateLevel = (xp) => calculateLevelInfo(xp);

/**
 * Anti-farming & Idempotent XP Award Engine.
 * Verifies that a specific action identified by `sourceId` has not already been awarded.
 * 
 * @param {Array} existingTransactions - Stored XP transaction ledger
 * @param {Object} payload - { amount, category, description, sourceId, date }
 * @returns {Object} { allowed: boolean, transaction: Object|null, reason: string }
 */
export const processXpAward = (existingTransactions = [], payload) => {
  const { amount, category, description, sourceId, date } = payload;

  if (!amount || Number(amount) <= 0) {
    return { allowed: false, transaction: null, reason: 'XP amount must be a positive number' };
  }

  if (!sourceId) {
    return { allowed: false, transaction: null, reason: 'Unique sourceId required to enforce reward idempotency' };
  }

  // Idempotency check: has this sourceId already awarded XP in the ledger?
  const alreadyAwarded = existingTransactions.some(t => t.sourceId === sourceId && !t.isReversal);
  if (alreadyAwarded) {
    return { allowed: false, transaction: null, reason: 'Reward already claimed for this event (Idempotency Protection)' };
  }

  const transactionDate = date || format(new Date(), 'yyyy-MM-dd');
  const transaction = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    date: transactionDate,
    category: category || 'General',
    amount: Math.round(Number(amount)),
    description: description || 'Completed tactical action',
    sourceId,
    isReversal: false
  };

  return { allowed: true, transaction, reason: 'XP Award Authorized' };
};

/**
 * Handles action reopening or cancellation with transparent ledger reversal.
 * 
 * @param {Array} existingTransactions - Stored XP transaction ledger
 * @param {string} sourceId - The unique sourceId to reverse
 * @param {string} reason - Reversal reason
 * @returns {Object} { allowed: boolean, transaction: Object|null, amount: number }
 */
export const processXpReversal = (existingTransactions = [], sourceId, reason = 'Action Reopened') => {
  if (!sourceId) return { allowed: false, transaction: null, amount: 0 };

  // Find original positive award
  const original = existingTransactions.find(t => t.sourceId === sourceId && !t.isReversal);
  if (!original) {
    return { allowed: false, transaction: null, amount: 0, reason: 'No prior award found to reverse' };
  }

  // Check if reversal already recorded
  const alreadyReversed = existingTransactions.some(t => t.sourceId === `reversal:${sourceId}`);
  if (alreadyReversed) {
    return { allowed: false, transaction: null, amount: 0, reason: 'Reversal already recorded' };
  }

  const reversalTransaction = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    date: format(new Date(), 'yyyy-MM-dd'),
    category: original.category,
    amount: -Math.abs(original.amount),
    description: `Reversal: ${original.description} (${reason})`,
    sourceId: `reversal:${sourceId}`,
    isReversal: true
  };

  return { allowed: true, transaction: reversalTransaction, amount: Math.abs(original.amount) };
};

/**
 * Computes daily XP earned on a specific date from the genuine transaction ledger.
 */
export const calculateDailyXp = (transactions = [], targetDate) => {
  const dateKey = targetDate || format(new Date(), 'yyyy-MM-dd');
  return transactions
    .filter(t => t.date === dateKey)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};

/**
 * Computes period XP earned within [startDate, endDate] inclusive.
 */
export const calculatePeriodXp = (transactions = [], startDate, endDate) => {
  return transactions
    .filter(t => (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};

/**
 * Generates an audit breakdown of XP earned grouped by category.
 */
export const getXpCategoryBreakdown = (transactions = []) => {
  const breakdown = {};
  transactions.forEach(t => {
    const cat = t.category || 'General';
    breakdown[cat] = (breakdown[cat] || 0) + (Number(t.amount) || 0);
  });
  return breakdown;
};

/**
 * Reconciles stored total XP against the ledger of transactions.
 * Returns self-healing diagnostics without destructive resets.
 * 
 * Supports both signatures:
 *   reconcileXpLedger(gamificationState)
 *   reconcileXpLedger(currentLifetimeXp, transactions)
 */
export const reconcileXpLedger = (firstArg = 0, secondArg = []) => {
  const isObj = typeof firstArg === 'object' && firstArg !== null;
  const currentLifetimeXp = isObj ? (firstArg.xp ?? firstArg.lifetimeXp ?? 0) : (Number(firstArg) || 0);
  const transactions = isObj ? (firstArg.auditLedger ?? firstArg.transactions ?? []) : (Array.isArray(secondArg) ? secondArg : []);

  const ledgerSum = transactions.reduce((sum, t) => {
    const amt = Number(t.amount) || 0;
    return sum + (t.isReversal ? -amt : amt);
  }, 0);

  const currentTotal = Math.max(0, Number(currentLifetimeXp) || 0);
  const normalizedLedgerSum = Math.max(0, ledgerSum);
  const diff = normalizedLedgerSum - currentTotal;

  return {
    matches: diff === 0,
    reconciled: diff !== 0,
    priorXp: currentTotal,
    currentLifetimeXp: currentTotal,
    computedXp: normalizedLedgerSum,
    ledgerSum: normalizedLedgerSum,
    discrepancy: diff,
    finalXp: Math.max(normalizedLedgerSum, currentTotal),
    reconciledXp: Math.max(normalizedLedgerSum, currentTotal),
    auditedEvents: transactions.length
  };
};
