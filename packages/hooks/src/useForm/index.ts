/**
 * useForm —— 表单数据层 hook：值管理 / 校验规则执行 / 字段错误状态（仅数据层，M1 范围）。
 *
 * 不产生、不耦合任何 UI 库 Form 实例；M2 UI 适配器落地后由适配器装配。独立模式运行。
 */
import { reactive } from 'vue';

/** 默认必填提示 */
const DEFAULT_REQUIRED_MESSAGE = '该字段为必填项';
/** 默认格式提示 */
const DEFAULT_PATTERN_MESSAGE = '该字段格式不正确';
/** 默认自定义校验失败提示 */
const DEFAULT_VALIDATOR_MESSAGE = '该字段校验未通过';

/**
 * 单条校验规则。
 */
export interface FormRule {
  /** 必填（undefined / null / 空串 / 空数组 视为空） */
  required?: boolean;
  /** 最小限制：字符串 / 数组为长度，数值为数值大小 */
  min?: number;
  /** 最大限制：字符串 / 数组为长度，数值为数值大小 */
  max?: number;
  /** 正则校验（对 String(value) 执行 test） */
  pattern?: RegExp | string;
  /** 自定义校验：true 通过；string 为错误文案；false 用默认文案；支持 Promise */
  validator?: (value: unknown) => boolean | string | Promise<boolean | string>;
  /** 校验失败提示文案（覆盖默认文案） */
  message?: string;
}

/** 字段级校验规则表 */
export type FormRules<T> = { [K in keyof T]?: FormRule[] };

/**
 * useForm 配置项（全部可选）。
 */
export interface UseFormOptions<T extends Record<string, unknown>> {
  /** 初始值（resetFields 恢复基准），默认 {} */
  initialValues?: T;
  /** 字段级校验规则（validate(rules?) 参数可按字段覆盖） */
  rules?: FormRules<T>;
}

/**
 * 校验结果。
 */
export interface ValidateResult {
  /** 是否全部通过 */
  valid: boolean;
  /** 字段级错误信息表（仅含失败字段） */
  errors: Record<string, string>;
}

/**
 * useForm 返回值。
 */
export interface UseFormResult<T extends Record<string, unknown>> {
  /** 表单值（reactive） */
  values: T;
  /** 字段级错误信息表（reactive，仅含失败字段，resetFields 清空） */
  errors: Record<string, string>;
  /**
   * 合并回显字段值（浅合并，不校验）。
   * @param partial - 待合并的字段值
   */
  setFieldsValue: (partial: Partial<T>) => void;
  /**
   * 读取单个字段值。
   * @param key - 字段名
   */
  getFieldValue: <K extends keyof T>(key: K) => T[K];
  /** 重置为 initialValues 并清空错误 */
  resetFields: () => void;
  /**
   * 执行校验。
   * @param rules - 临时规则表，按字段覆盖 options.rules
   * @returns { valid, errors }
   */
  validate: (rules?: FormRules<T>) => Promise<ValidateResult>;
}

/** 空值判定：undefined / null / 空串 / 空数组 */
function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
  );
}

/**
 * 执行单条规则校验。
 * @returns 错误文案；null 表示通过
 */
async function checkRule(value: unknown, rule: FormRule): Promise<string | null> {
  const empty = isEmptyValue(value);
  if (rule.required && empty) {
    return rule.message ?? DEFAULT_REQUIRED_MESSAGE;
  }
  // 非必填的空值跳过其余规则（与主流表单库一致）
  if (empty) {
    return null;
  }
  if (rule.min !== undefined || rule.max !== undefined) {
    const size = typeof value === 'number' ? value : (value as { length?: number }).length;
    if (typeof size === 'number') {
      if (rule.min !== undefined && size < rule.min) {
        return (
          rule.message ??
          (typeof value === 'number' ? `不能小于 ${rule.min}` : `长度不能少于 ${rule.min} 个字符`)
        );
      }
      if (rule.max !== undefined && size > rule.max) {
        return (
          rule.message ??
          (typeof value === 'number' ? `不能大于 ${rule.max}` : `长度不能超过 ${rule.max} 个字符`)
        );
      }
    }
  }
  if (rule.pattern !== undefined) {
    const regex = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
    if (!regex.test(String(value))) {
      return rule.message ?? DEFAULT_PATTERN_MESSAGE;
    }
  }
  if (rule.validator) {
    const outcome = await rule.validator(value);
    if (outcome === false) {
      return rule.message ?? DEFAULT_VALIDATOR_MESSAGE;
    }
    if (typeof outcome === 'string') {
      return outcome;
    }
  }
  return null;
}

/**
 * 表单数据层 hook。
 *
 * @param options - 配置项，全部可选
 * @returns values / errors 响应式状态与 setFieldsValue / getFieldValue / resetFields / validate 方法
 */
export function useForm<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseFormOptions<T> = {},
): UseFormResult<T> {
  const initialValues = options.initialValues ?? ({} as T);
  const rules = options.rules;
  const values = reactive({ ...initialValues }) as unknown as T;
  const errors = reactive<Record<string, string>>({});

  function setFieldsValue(partial: Partial<T>): void {
    Object.assign(values, partial);
  }

  function getFieldValue<K extends keyof T>(key: K): T[K] {
    return values[key];
  }

  function resetFields(): void {
    const record = values as unknown as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      delete record[key];
    }
    Object.assign(record, { ...initialValues });
    for (const key of Object.keys(errors)) {
      delete errors[key];
    }
  }

  function toRuleTable(table: FormRules<T> | undefined): Record<string, FormRule[]> {
    const out: Record<string, FormRule[]> = {};
    if (!table) return out;
    const record = table as unknown as Record<string, FormRule[] | undefined>;
    for (const field of Object.keys(record)) {
      const fieldRules = record[field];
      if (fieldRules && fieldRules.length > 0) {
        out[field] = fieldRules;
      }
    }
    return out;
  }

  async function validate(rulesOverride?: FormRules<T>): Promise<ValidateResult> {
    const effective: Record<string, FormRule[]> = {
      ...toRuleTable(rules),
      ...toRuleTable(rulesOverride),
    };
    const failures: Record<string, string> = {};
    for (const field of Object.keys(effective)) {
      const fieldRules = effective[field];
      if (!fieldRules || fieldRules.length === 0) continue;
      const value = (values as unknown as Record<string, unknown>)[field];
      for (const rule of fieldRules) {
        const error = await checkRule(value, rule);
        if (error !== null) {
          failures[field] = error;
          break;
        }
      }
    }
    for (const key of Object.keys(errors)) {
      delete errors[key];
    }
    Object.assign(errors, failures);
    return { valid: Object.keys(failures).length === 0, errors: { ...failures } };
  }

  return { values, errors, setFieldsValue, getFieldValue, resetFields, validate };
}
