<template>
  <div class="stack">
    <!-- 一、轻量展示件（不依赖 UI 库） -->
    <section class="panel">
      <h3 class="panel-title">EmptyState / StatusTag / ResultPage（纯展示件）</h3>
      <div class="row row--stretch">
        <div class="mini-box">
          <EmptyState description="暂无审批记录">
            <template #action>
              <button class="btn" type="button">去新建</button>
            </template>
          </EmptyState>
        </div>
        <div class="mini-box">
          <div class="row">
            <StatusTag :value="row.status" :mapping="STATUS_MAPPING" v-for="row in tagRows" :key="row.status" />
          </div>
        </div>
        <div class="mini-box mini-box--half">
          <ResultPage status="success" title="操作成功" sub-title="单据已保存草稿" />
        </div>
        <div class="mini-box mini-box--half">
          <ResultPage status="error" title="操作失败" sub-title="网络异常，请稍后重试" />
        </div>
      </div>
    </section>

    <!-- 二、SearchForm + EnhanceTable（useTable 联动） -->
    <section class="panel">
      <h3 class="panel-title">SearchForm + EnhanceTable（hooks useTable 联动）</h3>
      <SearchForm :fields="queryFields" :loading="table.loading.value" @search="handleSearch" @reset="() => table.reset()" />
      <EnhanceTable
        :columns="tableColumns"
        :data-source="table.dataSource.value"
        :loading="table.loading.value"
        :pagination="table.pagination"
        empty-text="没有符合条件的用户"
        @page-change="(current, size) => table.pagination.onChange(current, size)"
        @sort-change="handleSortChange"
      >
        <template #toolbar>
          <span class="hint">搜索区 + 工具栏插槽 + 统一空状态</span>
        </template>
        <template #bodyCell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'status'" :value="record.status" :mapping="STATUS_MAPPING" />
        </template>
      </EnhanceTable>
    </section>

    <!-- 三、MxDialog / MxDrawer / MxUpload / MxTreeSelect -->
    <section class="panel">
      <h3 class="panel-title">MxDialog / MxDrawer / MxUpload / MxTreeSelect（适配器壳组件）</h3>
      <div class="row">
        <button class="btn" type="button" @click="dialogOpen = true">打开 Dialog</button>
        <button class="btn" type="button" @click="drawerOpen = true">打开 Drawer</button>
        <MxUpload action="" />
        <MxTreeSelect v-model="treeValue" :tree-data="treeData" style="min-width: 200px" />
      </div>
      <MxDialog v-model:open="dialogOpen" title="确认操作" @ok="dialogOpen = false" @cancel="dialogOpen = false">
        <p>这是一个基于 UI 适配器 Modal 能力的统一壳组件。</p>
      </MxDialog>
      <MxDrawer v-model:open="drawerOpen" title="详情抽屉">
        <p>Drawer 内容区（默认适配器：Ant Design Vue）。</p>
      </MxDrawer>
    </section>

    <!-- 四、Lov 独立模式 -->
    <section class="panel">
      <h3 class="panel-title">Lov 独立模式（props 自请求 / 静态选项）</h3>
      <div class="row">
        <div class="field">
          <span class="field-label">接口模式（lovApi 弹窗表格，防抖搜索）</span>
          <Lov v-model="lovApiValue" :lov-api="mockLovApi" :field-names="{ label: 'name', value: 'code' }" style="width: 220px" />
        </div>
        <div class="field">
          <span class="field-label">静态值集模式（lovOptions）</span>
          <Lov v-model="lovStaticValue" :lov-options="genderOptions" style="width: 160px" />
        </div>
        <div class="field">
          <span class="field-label">多选接口模式</span>
          <Lov v-model="lovMultiValue" :lov-api="mockLovApi" :field-names="{ label: 'name', value: 'code' }" multiple style="width: 260px" />
        </div>
      </div>
      <div class="output">接口模式选中：{{ JSON.stringify(lovApiValue) }}　静态选中：{{ JSON.stringify(lovStaticValue) }}　多选：{{ JSON.stringify(lovMultiValue) }}</div>
    </section>

    <!-- 四-2、Lov 级联（省 → 市） -->
    <section class="panel">
      <h3 class="panel-title">Lov 级联（cascadeSource：父值变化清空子值 / 父空禁用子触发器）</h3>
      <div class="row">
        <div class="field">
          <span class="field-label">父级：省份</span>
          <Lov v-model="cascadeProvinceValue" :lov-api="mockRegionApi" :field-names="{ label: 'name', value: 'code' }" style="width: 220px" />
        </div>
        <div class="field">
          <span class="field-label">子级：城市（父空禁用，父值变化自动清空）</span>
          <Lov
            v-model="cascadeCityValue"
            :lov-api="mockRegionApi"
            :params="{ parentId: cascadeProvinceValue }"
            :cascade-source="cascadeProvinceValue"
            :field-names="{ label: 'name', value: 'code' }"
            style="width: 220px"
          />
        </div>
      </div>
      <div class="output">省份：{{ JSON.stringify(cascadeProvinceValue) }}　城市：{{ JSON.stringify(cascadeCityValue) }}（先选省份再选城市；切换省份观察城市被清空）</div>
    </section>

    <!-- 四-3、Lov 弹窗自定义（columns 覆盖 + bodyCell 单元格渲染） -->
    <section class="panel">
      <h3 class="panel-title">Lov 弹窗自定义（columns 覆盖弹窗列 + bodyCell 单元格渲染）</h3>
      <div class="row">
        <div class="field">
          <span class="field-label">自定义弹窗列 + 状态标签单元格</span>
          <Lov
            v-model="lovCustomValue"
            :lov-api="mockLovApi"
            :field-names="{ label: 'name', value: 'code' }"
            :columns="[{ dataIndex: 'name', title: '用户名称' }, { dataIndex: 'status', title: '状态' }]"
            style="width: 260px"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'status'">
                <span class="mx-demo__status-tag" :class="record.status === '1' ? 'is-on' : 'is-off'">
                  {{ record.status === '1' ? '在职' : '离职' }}
                </span>
              </template>
              <template v-else>{{ record[column.dataIndex] }}</template>
            </template>
          </Lov>
        </div>
      </div>
      <div class="output">弹窗列由 columns prop 覆盖为「用户名称 / 状态」，状态列经 bodyCell 槽渲染彩色标签；选中：{{ JSON.stringify(lovCustomValue) }}</div>
    </section>

    <!-- 五、Lov 基座联动 + 降级切换 -->
    <section class="panel">
      <h3 class="panel-title">Lov 基座联动模式（mock provide，降级切换验证）</h3>
      <div class="row">
        <label class="check">
          <input v-model="baseEnabled" type="checkbox" />
          模拟基座上下文（provide MX_RUNTIME_CONTEXT_KEY）
        </label>
        <span class="hint" :class="baseEnabled ? 'hint--ok' : 'hint--danger'">
          {{ baseEnabled ? '探测命中：复用上下文 lovListApi / 值集缓存' : '上下文丢失：已降级独立模式' }}
        </span>
      </div>
      <component :is="baseEnabled ? BaseMockProvider : 'div'">
        <div class="row">
          <div class="field">
            <span class="field-label">值集编码模式（基座值集缓存 STATUS）</span>
            <Lov v-model="lovCodeValue" lov-code="STATUS" style="width: 160px" />
          </div>
          <div class="field">
            <span class="field-label">接口模式（优先复用上下文 lovListApi）</span>
            <Lov v-model="lovCtxApiValue" :lov-api="standaloneLovApi" :field-names="{ label: 'name', value: 'code' }" style="width: 220px" />
          </div>
        </div>
      </component>
      <div class="output">值集编码选中：{{ JSON.stringify(lovCodeValue) }}　接口模式选中：{{ JSON.stringify(lovCtxApiValue) }}</div>
    </section>

    <!-- 六、DocumentTable -->
    <section class="panel">
      <h3 class="panel-title">DocumentTable 单据表格（行编辑 + 校验 + 行展开子表 + 单元格级权限）</h3>
      <div class="field">
        <label class="hint">
          <input v-model="docPermEnabled" type="checkbox" />
          授予「数量列」编辑权限（doc:edit:count）——取消勾选后数量列渲染只读文本，且保存时跳过其必填校验
        </label>
      </div>
      <DocumentTable
        v-model="docRows"
        v-model:expanded-row-keys="docExpandedKeys"
        :columns="docColumns"
        :permissions="docPermissions"
        row-key="id"
        @save="handleDocSave"
      >
        <template #expandedRow="{ record }">
          <div class="mx-demo__sub-table">
            <span class="hint">子单据：{{ record.name }} 的明细（业务在 expandedRow 槽内自由组合）</span>
            <DocumentTable
              :model-value="(record.children ?? []) as Array<Record<string, unknown>>"
              :columns="docChildColumns"
              row-key="id"
              :editable="false"
            />
          </div>
        </template>
      </DocumentTable>
      <div class="output">最近一次 save 数据：{{ docSaveOutput }}</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTable } from '@mengxi-ark/hooks';
import {
  EmptyState,
  EnhanceTable,
  MxDialog,
  MxDrawer,
  MxTreeSelect,
  MxUpload,
  ResultPage,
  SearchForm,
  StatusTag,
} from '@mengxi-ark/components';
import type { MxColumn, MxSelectOption } from '@mengxi-ark/components';
import { DocumentTable, Lov } from '@mengxi-ark/biz-components';
import type { DocColumn, LovOption } from '@mengxi-ark/biz-components';
import BaseMockProvider from './BaseMockProvider.vue';
import { createMockLovApi, createMockRegionLovApi, createMockUserTableSource } from './mock-api';

// —— 一、轻量展示件 ——
const STATUS_MAPPING = {
  '1': { label: '启用', tone: 'success' as const },
  '0': { label: '停用', tone: 'error' as const },
  '2': { label: '冻结', tone: 'warning' as const },
};
const tagRows = [{ status: '1' }, { status: '0' }, { status: '2' }];

// —— 二、SearchForm + EnhanceTable ——
const queryFields = [
  { name: 'keyword', label: '名称/编码', type: 'input' as const, placeholder: '请输入名称或编码' },
  {
    name: 'status',
    label: '状态',
    type: 'select' as const,
    options: [
      { label: '启用', value: '1' },
      { label: '停用', value: '0' },
    ],
  },
];
const tableColumns: MxColumn[] = [
  { dataIndex: 'code', title: '编码', width: 120 },
  { dataIndex: 'name', title: '名称', sortable: true },
  { dataIndex: 'status', title: '状态', width: 120 },
];
const table = useTable<Record<string, unknown>, Record<string, unknown>>(createMockUserTableSource());

function handleSearch(values: Record<string, unknown>): void {
  void table.search({ keyword: values.keyword, status: values.status });
}

function handleSortChange(field: string, order: 'asc' | 'desc'): void {
  table.sort.field = field;
  table.sort.order = order;
  void table.run();
}

// —— 三、壳组件 ——
const dialogOpen = ref(false);
const drawerOpen = ref(false);
const treeValue = ref<string | null>(null);
const treeData = [
  { key: '1', title: '华东区', children: [{ key: '1-1', title: '上海' }, { key: '1-2', title: '杭州' }] },
  { key: '2', title: '华南区', children: [{ key: '2-1', title: '深圳' }] },
];

// —— 四、Lov 独立模式 ——
const mockLovApi = createMockLovApi('独立模式');
const standaloneLovApi = createMockLovApi('props 兜底');
const genderOptions: LovOption[] = [
  { label: '男', value: 'M' },
  { label: '女', value: 'F' },
];
const lovApiValue = ref<string | null>(null);
const lovStaticValue = ref<string | null>(null);
const lovMultiValue = ref<Array<string>>([]);

// —— 四-2、Lov 级联（省 → 市） ——
const mockRegionApi = createMockRegionLovApi();
const cascadeProvinceValue = ref<string | null>(null);
const cascadeCityValue = ref<string | null>(null);

// —— 四-3、Lov 弹窗自定义 ——
const lovCustomValue = ref<string | null>(null);

// —— 五、Lov 基座联动 ——
const baseEnabled = ref(true);
const lovCodeValue = ref<string | null>(null);
const lovCtxApiValue = ref<string | null>(null);

// —— 六、DocumentTable ——
const docColumns: DocColumn[] = [
  { dataIndex: 'name', title: '物料名称', editable: true, rules: [{ required: true, message: '物料名称不能为空' }] },
  { dataIndex: 'count', title: '数量', editable: true, permissionCode: 'doc:edit:count', rules: [{ required: true, message: '数量不能为空' }] },
  {
    dataIndex: 'unit',
    title: '单位',
    editable: true,
    editorType: 'select',
    editorOptions: [
      { label: '件', value: 'PCS' },
      { label: '箱', value: 'BOX' },
    ] as MxSelectOption[],
    rules: [{ required: true, message: '单位不能为空' }],
  },
];
const docRows = ref<Array<Record<string, unknown>>>([
  { id: 'd1', name: '机架服务器', count: 2, unit: 'BOX', children: [{ id: 'd1-1', name: '电源模块', count: 2 }, { id: 'd1-2', name: '导轨套件', count: 4 }] },
  { id: 'd2', name: '网线', count: 10, unit: 'PCS', children: [] },
]);
const docExpandedKeys = ref<Array<string | number>>(['d1']);
const docChildColumns: DocColumn[] = [
  { dataIndex: 'name', title: '子物料' },
  { dataIndex: 'count', title: '数量' },
];
const docSaveOutput = ref('（尚未保存）');
// —— 六-2、单元格级权限演示：permissions props 兜底（独立模式；切换演示权限命中 / 只读降级） ——
const docPermEnabled = ref(true);
const docPermissions = computed(() => (docPermEnabled.value ? ['doc:edit:count'] : []));

function handleDocSave(rows: Array<Record<string, unknown>>): void {
  docSaveOutput.value = JSON.stringify(rows);
}
</script>

<style scoped>
.row--stretch {
  align-items: stretch;
}

.mini-box {
  flex: 1;
  min-width: 220px;
  padding: var(--mx-spacing-sm);
  border: 1px dashed var(--mx-color-border-base);
  border-radius: var(--mx-radius-base);
}

.mini-box--half {
  flex: 1.5;
}

.mx-demo__sub-table {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-sm);
  padding: var(--mx-spacing-sm);
  background: var(--mx-color-bg-layout);
  border-radius: var(--mx-radius-base);
}

.mx-demo__status-tag {
  display: inline-block;
  padding: 0 var(--mx-spacing-sm);
  border-radius: var(--mx-radius-round);
  font-size: 12px;
  line-height: 20px;
}

.mx-demo__status-tag.is-on {
  color: var(--mx-color-success);
  background: var(--mx-color-bg-hover);
}

.mx-demo__status-tag.is-off {
  color: var(--mx-color-text-secondary);
  background: var(--mx-color-bg-layout);
}
</style>
