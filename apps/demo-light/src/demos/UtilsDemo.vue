<script setup lang="ts">
import { computed, ref } from 'vue';
import { deepClone, formatDate, formatMoney, formatNumber, groupBy, isPhone, unique } from '@mengxi-ark/utils';

const dateInput = ref('2026-11-25T08:09:10');
const datePattern = ref('YYYY-MM-DD HH:mm:ss');
const dateOutput = computed(() => formatDate(dateInput.value, datePattern.value) || '（无法解析为有效日期）');

const moneyInput = ref('1234567.891');
const moneyOutput = computed(() => formatMoney(moneyInput.value) || '（无法解析为有效金额）');

const numberInput = ref('-9876543.21');
const numberOutput = computed(
  () => formatNumber(numberInput.value, { thousandSeparator: '_' }) || '（无法解析为有效数字）',
);

const phoneInput = ref('13812345678');
const phoneOutput = computed(() => (isPhone(phoneInput.value) ? '✓ 合法手机号' : '✗ 非法手机号'));

const uniqueInput = ref('1,2,2,3,3,3');
const uniqueOutput = computed(() => {
  const list = uniqueInput.value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '')
    .map(Number);
  return JSON.stringify(unique(list));
});

const people = [
  { name: '张三', dept: '平台组' },
  { name: '李四', dept: '工具组' },
  { name: '王五', dept: '平台组' },
];
const groupOutput = JSON.stringify(groupBy(people, (person) => person.dept), null, 2);

const cloneInput = ref('{"name":"曦舟","bornAt":"2026-01-01T08:00:00","tags":["中台","前端"]}');
const cloneOutput = computed(() => {
  try {
    return JSON.stringify(deepClone(JSON.parse(cloneInput.value)), null, 2);
  } catch {
    return '（输入不是合法 JSON）';
  }
});
</script>

<template>
  <div class="stack">
    <section class="panel">
      <h3 class="panel-title">
        formatDate · 日期格式化（YYYY / MM / DD / HH / mm / ss / SSS）
      </h3>
      <div class="row">
        <label class="field">
          <span class="field-label">日期输入</span>
          <input
            v-model="dateInput"
            class="input"
            type="text"
          >
        </label>
        <label class="field">
          <span class="field-label">格式模式</span>
          <input
            v-model="datePattern"
            class="input"
            type="text"
          >
        </label>
      </div>
      <p class="output">
        {{ dateOutput }}
      </p>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        formatMoney · 金额格式化（货币符号 + 千分位 + 固定小数位）
      </h3>
      <div class="row">
        <label class="field">
          <span class="field-label">金额输入</span>
          <input
            v-model="moneyInput"
            class="input"
            type="text"
          >
        </label>
      </div>
      <p class="output">
        {{ moneyOutput }}
      </p>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        formatNumber · 数字格式化（千分位分隔符可自定义）
      </h3>
      <div class="row">
        <label class="field">
          <span class="field-label">数字输入</span>
          <input
            v-model="numberInput"
            class="input"
            type="text"
          >
        </label>
      </div>
      <p class="output">
        {{ numberOutput }}
      </p>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        isPhone · 中国大陆手机号校验
      </h3>
      <div class="row">
        <label class="field">
          <span class="field-label">手机号输入</span>
          <input
            v-model="phoneInput"
            class="input"
            type="text"
          >
        </label>
      </div>
      <p class="output">
        {{ phoneOutput }}
      </p>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        unique · 数组去重（逗号分隔输入）
      </h3>
      <div class="row">
        <label class="field">
          <span class="field-label">数组输入</span>
          <input
            v-model="uniqueInput"
            class="input"
            type="text"
          >
        </label>
      </div>
      <p class="output">
        {{ uniqueOutput }}
      </p>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        groupBy · 按部门分组
      </h3>
      <p class="output">
        {{ groupOutput }}
      </p>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        deepClone · 深拷贝（structuredClone 优先，JSON 兜底）
      </h3>
      <div class="row">
        <label class="field">
          <span class="field-label">JSON 输入</span>
          <input
            v-model="cloneInput"
            class="input"
            type="text"
          >
        </label>
      </div>
      <p class="output">
        {{ cloneOutput }}
      </p>
    </section>
  </div>
</template>
