import { describe, expect, it } from 'vitest';
import { useForm } from '../index';

describe('useForm', () => {
  it('setFieldsValue 合并回显 / getFieldValue / resetFields', () => {
    const { values, setFieldsValue, getFieldValue, resetFields } = useForm({
      initialValues: { name: 'init', age: 18 },
    });
    setFieldsValue({ name: 'updated' });
    expect(values.name).toBe('updated');
    expect(values.age).toBe(18);
    expect(getFieldValue('name')).toBe('updated');
    resetFields();
    expect(values.name).toBe('init');
    expect(values.age).toBe(18);
  });

  it('校验通过：errors 为空', async () => {
    const { validate } = useForm({
      initialValues: { name: 'abc', remark: '' },
      rules: {
        name: [{ required: true }, { max: 5 }],
        // 非必填空值跳过其余规则
        remark: [{ pattern: /^\d+$/ }],
      },
    });
    const result = await validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('required 失败写入字段级错误', async () => {
    const { errors, validate } = useForm<{ name: string }>({
      initialValues: { name: '' },
      rules: { name: [{ required: true, message: '请输入名称' }] },
    });
    const result = await validate();
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('请输入名称');
    expect(errors.name).toBe('请输入名称');
  });

  it('min / max / pattern / validator 失败给出错误文案', async () => {
    const { validate } = useForm({
      initialValues: { name: 'ab', age: 5, email: 'bad', custom: 'x' },
      rules: {
        name: [{ min: 3 }],
        age: [{ min: 10, max: 100 }],
        email: [{ pattern: /^\S+@\S+$/ }],
        custom: [{ validator: () => '自定义失败' }],
      },
    });
    const result = await validate();
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('长度不能少于 3 个字符');
    expect(result.errors.age).toBe('不能小于 10');
    expect(result.errors.email).toBe('该字段格式不正确');
    expect(result.errors.custom).toBe('自定义失败');
  });

  it('validator 支持 Promise 并可通过', async () => {
    const { values, validate } = useForm<{ name: string }>({
      initialValues: { name: 'no' },
      rules: {
        name: [
          {
            validator: async (value) => (value === 'ok' ? true : '需为 ok'),
          },
        ],
      },
    });
    const failed = await validate();
    expect(failed.valid).toBe(false);
    expect(failed.errors.name).toBe('需为 ok');
    values.name = 'ok';
    const passed = await validate();
    expect(passed.valid).toBe(true);
  });

  it('validate(rules?) 临时规则按字段覆盖', async () => {
    const { validate } = useForm({ initialValues: { a: '', b: '' } });
    const result = await validate({ a: [{ required: true, message: '必填' }] });
    expect(result.valid).toBe(false);
    expect(result.errors.a).toBe('必填');
    expect(result.errors.b).toBeUndefined();
  });

  it('resetFields 清空错误', async () => {
    const { values, errors, resetFields, validate } = useForm<{ name: string }>({
      initialValues: { name: '' },
      rules: { name: [{ required: true }] },
    });
    const failed = await validate();
    expect(failed.valid).toBe(false);
    expect(errors.name).toBeDefined();
    resetFields();
    expect(values.name).toBe('');
    expect(errors).toEqual({});
  });
});
