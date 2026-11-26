/**
 * FormSchema —— 表单 Schema（FormRenderer 渲染）。
 *
 * 渲染器维护内部表单值（update:modelValue 抛出全量），submit 前统一执行 rules 校验，
 * 校验通过才 emit submit（渲染器不自带提交请求，§10「渲染器只渲染」）。
 */
import type { MxSize } from '@mengxi-ark/components';
import type { FieldSchemaBase } from './common';

/** 表单字段 Schema（公共字段直用） */
export type FormFieldSchema = FieldSchemaBase;

/** 表单 Schema */
export interface FormSchema {
  /** Schema 类别标识 */
  kind: 'form';
  /** 表单字段配置（必填） */
  fields: FormFieldSchema[];
  /** 表单标题 */
  title?: string;
  /** 尺寸语义（sm | md | lg），字段级 size 优先 */
  size?: MxSize;
  /** 标签列宽度（CSS 值，如 '120px'），默认 '110px' */
  labelWidth?: string;
  /** 提交按钮文案，默认「保存」 */
  submitText?: string;
  /** 是否渲染内置提交按钮，默认 true（嵌入 Dialog 自定义按钮时可关闭） */
  showSubmit?: boolean;
  /** 提交按钮 loading */
  loading?: boolean;
}
