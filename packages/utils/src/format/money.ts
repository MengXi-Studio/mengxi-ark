/**
 * formatMoney 可选配置。
 */
export interface FormatMoneyOptions {
  /** 小数位数，默认 2；取值截断到 0~20 */
  precision?: number;
  /** 货币符号前缀，默认 '¥'；传空字符串表示不带符号 */
  symbol?: string;
  /** 是否添加千分位分隔符（固定 ','），默认 true */
  separator?: boolean;
}

/**
 * 格式化金额：货币符号 + 千分位 + 固定小数位。
 *
 * 负数时负号置于最前（如 '-¥1,234.50'）；字符串入参按 Number 解析，空串或解析失败返回 ''。
 * 超大数值可能出现科学计数法，仅适用于常规金额范围。
 *
 * @param value 金额数值或数字字符串
 * @param options 可选配置：precision / symbol / separator
 * @returns 格式化后的金额字符串；无法解析为有效数字时返回 ''
 *
 * @example
 * formatMoney(1234567.891); // '¥1,234,567.89'
 * formatMoney(-1234.5, { precision: 1 }); // '-¥1,234.5'
 * formatMoney(1234.5, { symbol: '', separator: false }); // '1234.50'
 */
export function formatMoney(value: number | string, options: FormatMoneyOptions = {}): string {
  const { precision = 2, symbol = '¥', separator = true } = options;
  if (typeof value === 'string' && value.trim() === '') return '';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  const safePrecision = Math.min(Math.max(precision, 0), 20);
  const fixed = Math.abs(amount).toFixed(safePrecision);
  const [intPart, decimalPart] = fixed.split('.');
  const grouped = separator ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : intPart;
  const sign = amount < 0 ? '-' : '';
  const digits = decimalPart === undefined ? grouped : `${grouped}.${decimalPart}`;
  return `${sign}${symbol}${digits}`;
}
