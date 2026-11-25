/**
 * formatNumber 可选配置。
 */
export interface FormatNumberOptions {
  /** 小数位数；未指定时保留原值小数；取值截断到 0~20 */
  precision?: number;
  /** 千分位分隔符，默认 ','；传空字符串表示不分隔 */
  thousandSeparator?: string;
}

/**
 * 格式化数字：千分位分隔 + 可选固定小数位。
 *
 * 未指定 precision 时保留原值小数（不做四舍五入补零）；负号置于最前；
 * 字符串入参按 Number 解析，空串或解析失败返回 ''。
 *
 * @param value 数值或数字字符串
 * @param options 可选配置：precision / thousandSeparator
 * @returns 格式化后的数字字符串；无法解析为有效数字时返回 ''
 *
 * @example
 * formatNumber(1234567.891); // '1,234,567.891'
 * formatNumber(1234567.891, { precision: 2 }); // '1,234,567.89'
 * formatNumber(-9876543.21, { thousandSeparator: '_' }); // '-9_876_543.21'
 */
export function formatNumber(value: number | string, options: FormatNumberOptions = {}): string {
  const { precision, thousandSeparator = ',' } = options;
  if (typeof value === 'string' && value.trim() === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  const fixed = precision === undefined ? String(num) : num.toFixed(Math.min(Math.max(precision, 0), 20));
  const negative = fixed.startsWith('-');
  const digits = negative ? fixed.slice(1) : fixed;
  const [intPart, decimalPart] = digits.split('.');
  const grouped =
    thousandSeparator === '' ? intPart : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  const result = decimalPart === undefined ? grouped : `${grouped}.${decimalPart}`;
  return negative ? `-${result}` : result;
}
