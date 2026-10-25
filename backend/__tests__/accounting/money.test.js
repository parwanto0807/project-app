import {
  MoneyValidationError,
  toMinorUnits,
  fromMinorUnits,
  sumMinorUnits,
  splitDebitCredit,
  expectedNormalBalance,
  assertCoaNormalBalance,
  calculateNormalBalance,
  validateBalancedLines,
} from '../../src/utils/money.js';

describe('money minor-unit arithmetic', () => {
  test('menjumlahkan desimal tanpa floating-point error', () => {
    expect(fromMinorUnits(sumMinorUnits(['0.10', '0.20']))).toBe('0.30');
    expect(fromMinorUnits(sumMinorUnits(['999999999999.99', '0.01']))).toBe('1000000000000.00');
  });

  test('mendukung Prisma Decimal-like object dan legacy Float sebagai input', () => {
    expect(toMinorUnits({ toString: () => '1234.56' })).toBe(123456n);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30n);
  });

  test('menolak presisi yang tidak eksplisit', () => {
    expect(() => toMinorUnits('1.001')).toThrow(MoneyValidationError);
    expect(() => toMinorUnits('1,000.00')).toThrow(MoneyValidationError);
    expect(() => toMinorUnits(Number.NaN)).toThrow(MoneyValidationError);
  });

  test('split debit/credit tidak pernah mengisi kedua sisi', () => {
    expect(splitDebitCredit('125.50')).toEqual({ debit: 12550n, credit: 0n });
    expect(splitDebitCredit('-125.50')).toEqual({ debit: 0n, credit: 12550n });
    expect(splitDebitCredit(0)).toEqual({ debit: 0n, credit: 0n });
  });
});

describe('normal balance COA', () => {
  test.each([
    ['ASET', 'DEBIT'],
    ['HPP', 'DEBIT'],
    ['BEBAN', 'DEBIT'],
    ['LIABILITAS', 'CREDIT'],
    ['EKUITAS', 'CREDIT'],
    ['PENDAPATAN', 'CREDIT'],
  ])('%s memiliki saldo normal %s', (type, expected) => {
    expect(expectedNormalBalance(type)).toBe(expected);
  });

  test('menghitung saldo natural sesuai sisi normal', () => {
    expect(calculateNormalBalance({ debit: '100.00', credit: '25.00', type: 'ASET' })).toBe(7500n);
    expect(calculateNormalBalance({ debit: '100.00', credit: '125.00', type: 'LIABILITAS' })).toBe(2500n);
  });

  test('menolak COA dengan saldo normal yang bertentangan dengan tipenya', () => {
    expect(() => assertCoaNormalBalance({ code: '1-1', type: 'ASET', normalBalance: 'CREDIT' }))
      .toThrow(/harus DEBIT/);
  });
});

describe('strict double-entry validation', () => {
  test('menerima jurnal balance secara mutlak', () => {
    const result = validateBalancedLines([
      { debitAmount: '100.00', creditAmount: 0 },
      { debitAmount: 0, creditAmount: '100.00' },
    ]);
    expect(result.totalDebit).toBe(10000n);
    expect(result.totalCredit).toBe(10000n);
  });

  test('menolak selisih 0.01 yang sebelumnya ditoleransi', () => {
    expect(() => validateBalancedLines([
      { debitAmount: '100.00', creditAmount: 0 },
      { debitAmount: 0, creditAmount: '99.99' },
    ])).toThrow(/Jurnal tidak seimbang/);
  });

  test.each([
    [[{ debitAmount: '1.00', creditAmount: '1.00' }, { debitAmount: 0, creditAmount: '1.00' }], 'INVALID_JOURNAL_SIDE'],
    [[{ debitAmount: 0, creditAmount: 0 }, { debitAmount: '1.00', creditAmount: '1.00' }], 'INVALID_JOURNAL_SIDE'],
    [[{ debitAmount: '-1.00', creditAmount: 0 }, { debitAmount: 0, creditAmount: '1.00' }], 'NEGATIVE_JOURNAL_AMOUNT'],
  ])('menolak baris jurnal tidak valid', (lines, code) => {
    try {
      validateBalancedLines(lines);
      throw new Error('Seharusnya ditolak');
    } catch (error) {
      expect(error).toBeInstanceOf(MoneyValidationError);
      expect(error.code).toBe(code);
    }
  });

  test('menolak jurnal kurang dari dua baris', () => {
    expect(() => validateBalancedLines([{ debitAmount: '1.00', creditAmount: '1.00' }]))
      .toThrow(/minimal dua baris/);
  });
});
