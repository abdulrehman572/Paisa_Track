export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolFirst: boolean;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  PKR: { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', decimals: 2, symbolFirst: true },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, symbolFirst: true },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, symbolFirst: true },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, symbolFirst: true },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, symbolFirst: true },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimals: 2, symbolFirst: true },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', decimals: 2, symbolFirst: true },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, symbolFirst: true },
  SGD: { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', decimals: 2, symbolFirst: true },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', decimals: 2, symbolFirst: false },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, symbolFirst: false },
};

/**
 * Converts minor integer units (cents/paisa) into major float for calculations
 */
export function minorToMajor(amountMinor: number, currency = 'USD'): number {
  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;
  const factor = Math.pow(10, config.decimals);
  return amountMinor / factor;
}

/**
 * Converts user decimal input or major float into integer minor units without float error
 */
export function majorToMinor(amountMajor: number, currency = 'USD'): number {
  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;
  const factor = Math.pow(10, config.decimals);
  return Math.round(amountMajor * factor);
}

/**
 * Parses user input string (e.g. "124.50" or "$1,200.00") into minor integer units
 */
export function parseMoneyToMinor(inputStr: string, currency = 'USD'): number {
  if (!inputStr) return 0;
  // Clean non-digit characters except period and minus
  const cleaned = inputStr.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return majorToMinor(parsed, currency);
}

/**
 * Formats minor units to display string (e.g. 1050 minor units in USD -> "$10.50")
 */
export function formatMoney(
  amountMinor: number,
  currency = 'USD',
  options?: {
    showSign?: boolean;
    compact?: boolean;
    hideDecimalsIfWhole?: boolean;
  }
): string {
  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;
  const isNegative = amountMinor < 0;
  const absMinor = Math.abs(amountMinor);
  const factor = Math.pow(10, config.decimals);
  const major = absMinor / factor;

  let formattedNumber = '';

  if (options?.compact && major >= 10000) {
    if (major >= 1000000) {
      formattedNumber = (major / 1000000).toFixed(1) + 'M';
    } else {
      formattedNumber = (major / 1000).toFixed(1) + 'k';
    }
  } else {
    formattedNumber = major.toLocaleString('en-US', {
      minimumFractionDigits: options?.hideDecimalsIfWhole && absMinor % factor === 0 ? 0 : config.decimals,
      maximumFractionDigits: config.decimals,
    });
  }

  const sign = isNegative ? '-' : options?.showSign ? '+' : '';
  const space = config.symbolFirst && /[a-zA-Z]$/.test(config.symbol) ? ' ' : '';
  const result = config.symbolFirst
    ? `${sign}${config.symbol}${space}${formattedNumber}`
    : `${sign}${formattedNumber} ${config.symbol}`;

  return result;
}
