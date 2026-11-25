/** 中国大陆手机号：1 开头、第二位 3-9、共 11 位数字 */
const PHONE_REGEXP = /^1[3-9]\d{9}$/;

/** 宽松邮箱格式：不允许空格，必须含一个 @ 且域名带点 */
const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 18 位身份证格式：前 17 位数字 + 末位数字或 X/x */
const ID_CARD_REGEXP = /^\d{17}[\dXx]$/;

/** GB 11643-1999 校验位算法权重 */
const ID_CARD_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

/** 校验码表：余数 0~10 对应 1 0 X 9 8 7 6 5 4 3 2 */
const ID_CARD_CHECK_CODES = '10X98765432';

/**
 * 校验中国大陆手机号。
 *
 * @param value 待校验字符串
 * @returns 是否为合法手机号（1 开头、第二位 3-9、共 11 位数字）
 *
 * @example
 * isPhone('13812345678'); // true
 * isPhone('12812345678'); // false（第二位非法）
 * isPhone('1381234567'); // false（长度不足）
 */
export function isPhone(value: string): boolean {
  return PHONE_REGEXP.test(value);
}

/**
 * 校验邮箱格式（宽松校验，不做完整 RFC 5322 校验）。
 *
 * @param value 待校验字符串
 * @returns 是否符合「本地部分@域名.后缀」且不含空格
 *
 * @example
 * isEmail('user@example.com'); // true
 * isEmail('user@example'); // false（域名缺少点后缀）
 */
export function isEmail(value: string): boolean {
  return EMAIL_REGEXP.test(value);
}

/**
 * 校验 18 位中国居民身份证号（格式 + 末位校验位，GB 11643-1999 算法）。
 *
 * 末位支持 X / x；本函数只验证格式与校验位，不校验出生日期是否为真实存在的日期。
 *
 * @param value 待校验字符串
 * @returns 校验位是否正确
 *
 * @example
 * isIdCard('11010519491231002X'); // true
 * isIdCard('110105194912310021'); // false（校验位错误）
 */
export function isIdCard(value: string): boolean {
  if (!ID_CARD_REGEXP.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    sum += Number(value[i]) * ID_CARD_WEIGHTS[i];
  }
  return ID_CARD_CHECK_CODES[sum % 11] === value[17].toUpperCase();
}

/**
 * 判断值是否为空：null / undefined / 空字符串 / 空数组 / 无自有可枚举属性的对象。
 *
 * 注意：0、false、NaN 等原始值不算空；' '（含空格）不算空；
 * 对象按 Object.keys 数量判断（Map / Set 不适用）。
 *
 * @param value 任意值
 * @returns 是否为空
 *
 * @example
 * isEmpty(null); // true
 * isEmpty([]); // true
 * isEmpty({ a: 1 }); // false
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}
