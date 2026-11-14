const MINOR_UNIT_FACTOR = 100n;
const ZERO = 0n;

export class MoneyValidationError extends Error {
  constructor(message, code = 'INVALID_MONEY') {
    super(message);
    this.name = 'MoneyValidationError';
    this.code = code;
  }
}

/**
 * Convert a monetary value to the smallest currency unit (sen).
 *
 * All arithmetic in the accounting module uses the returned BigInt. Number is
 * accepted only as a legacy input/Prisma-Float compatibility boundary and is
 * immediately normalized to two decimal places; it is never used for math.
 *
 * @param {string|number|bigint|{toString(): string}|null|undefined} value
 * @param {string} field
 * @returns {bigint}
 */
export function toMinorUnits(value, field = 'amount') {
  if (value === null || value === undefined || value === '') return ZERO;
  if (typeof value === 'bigint') return value;

  let text;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new MoneyValidationError(`${field} harus berupa angka yang valid`);
    }
    // Conversion only, not arithmetic. Needed while reading legacy Float rows.
    text = value.toFixed(2);
  } else {
    text = String(value).trim();
  }

  const match = text.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) {
    throw new MoneyValidationError(
      `${field} harus berupa desimal dengan maksimal 2 angka di belakang koma`
    );
  }

  const [, sign, whole, fraction = ''] = match;
  if (fraction.length > 2) {
    throw new MoneyValidationError(
      `${field} memiliki lebih dari 2 angka desimal; bulatkan secara eksplisit sebelum posting`
    );
  }

  const units = BigInt(whole) * MINOR_UNIT_FACTOR + BigInt(fraction.padEnd(2, '0'));
  return sign === '-' ? -units : units;
}

/** Format minor units as a Prisma/JSON-safe decimal string. */
export function fromMinorUnits(value) {
  const minor = toMinorUnits(value);
  const negative = minor < ZERO;
  const absolute = negative ? -minor : minor;
  const whole = absolute / MINOR_UNIT_FACTOR;
  const fraction = String(absolute % MINOR_UNIT_FACTOR).padStart(2, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

export function sumMinorUnits(values) {
  let total = ZERO;
  for (const value of values) total += toMinorUnits(value);
  return total;
}

export function absMinorUnits(value) {
  const minor = toMinorUnits(value);
  return minor < ZERO ? -minor : minor;
}

/** Split a signed amount into exactly one debit or credit side. */
export function splitDebitCredit(netAmount) {
  const net = toMinorUnits(netAmount);
  return {
    debit: net > ZERO ? net : ZERO,
    credit: net < ZERO ? -net : ZERO,
  };
}

const DEBIT_NORMAL_TYPES = new Set(['ASET', 'HPP', 'BEBAN', 'ASSET', 'EXPENSE', 'COGS']);
const CREDIT_NORMAL_TYPES = new Set([
  'LIABILITAS',
  'EKUITAS',
  'PENDAPATAN',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
]);

export function expectedNormalBalance(accountType) {
  if (DEBIT_NORMAL_TYPES.has(accountType)) return 'DEBIT';
  if (CREDIT_NORMAL_TYPES.has(accountType)) return 'CREDIT';
  throw new MoneyValidationError(
    `Tipe COA '${accountType}' tidak dikenal untuk perhitungan saldo normal`,
    'INVALID_ACCOUNT_TYPE'
  );
}

export function assertCoaNormalBalance(account) {
  if (!account?.type || !account?.normalBalance) {
    throw new MoneyValidationError('COA harus memiliki type dan normalBalance', 'INVALID_COA');
  }

  const expected = expectedNormalBalance(account.type);
  if (account.normalBalance !== expected) {
    throw new MoneyValidationError(
      `Saldo normal akun ${account.code || account.id} harus ${expected} untuk tipe ${account.type}, bukan ${account.normalBalance}`,
      'INVALID_NORMAL_BALANCE'
    );
  }
  return expected;
}

/**
 * Return the account balance in its natural (normal-balance) sign.
 * Asset/HPP/Beban = debit-credit; Liability/Equity/Revenue = credit-debit.
 */
export function calculateNormalBalance({ debit, credit, normalBalance, type }) {
  const debitMinor = toMinorUnits(debit);
  const creditMinor = toMinorUnits(credit);
  const normal = normalBalance || expectedNormalBalance(type);
  return normal === 'DEBIT' ? debitMinor - creditMinor : creditMinor - debitMinor;
}

/**
 * Validate immutable journal invariants before anything is persisted.
 * No tolerance is allowed: total debit must equal total credit in minor units.
 */
export function validateBalancedLines(lines, { debitKey = 'debitAmount', creditKey = 'creditAmount' } = {}) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new MoneyValidationError(
      'Jurnal wajib memiliki minimal dua baris debit dan kredit',
      'JOURNAL_LINE_COUNT'
    );
  }

  let totalDebit = ZERO;
  let totalCredit = ZERO;
  let hasDebit = false;
  let hasCredit = false;

  const normalizedLines = lines.map((line, index) => {
    const lineNumber = index + 1;
    const debit = toMinorUnits(line[debitKey], `debit baris ${lineNumber}`);
    const credit = toMinorUnits(line[creditKey], `credit baris ${lineNumber}`);

    if (debit < ZERO || credit < ZERO) {
      throw new MoneyValidationError(
        `Nominal debit/credit baris ${lineNumber} tidak boleh negatif; pindahkan nilai ke sisi lawan`,
        'NEGATIVE_JOURNAL_AMOUNT'
      );
    }
    if ((debit > ZERO && credit > ZERO) || (debit === ZERO && credit === ZERO)) {
      throw new MoneyValidationError(
        `Baris ${lineNumber} harus memiliki tepat satu nilai debit atau kredit yang lebih dari nol`,
        'INVALID_JOURNAL_SIDE'
      );
    }

    totalDebit += debit;
    totalCredit += credit;
    hasDebit ||= debit > ZERO;
    hasCredit ||= credit > ZERO;

    return { ...line, debitMinor: debit, creditMinor: credit };
  });

  if (!hasDebit || !hasCredit || totalDebit !== totalCredit) {
    throw new MoneyValidationError(
      `Jurnal tidak seimbang: debit ${fromMinorUnits(totalDebit)}, kredit ${fromMinorUnits(totalCredit)}, selisih ${fromMinorUnits(totalDebit - totalCredit)}`,
      'UNBALANCED_JOURNAL'
    );
  }

  return { lines: normalizedLines, totalDebit, totalCredit };
}

/**
 * Backward-compatible API serialization only. Never use this value for
 * calculations; use toMinorUnits/fromMinorUnits instead.
 */
export function minorUnitsToLegacyNumber(value) {
  return Number(fromMinorUnits(value));
}

export const money = {
  toMinorUnits,
  fromMinorUnits,
  sumMinorUnits,
  absMinorUnits,
  splitDebitCredit,
  expectedNormalBalance,
  assertCoaNormalBalance,
  calculateNormalBalance,
  validateBalancedLines,
  minorUnitsToLegacyNumber,
};

export default money;
