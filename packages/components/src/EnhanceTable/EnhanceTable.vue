<template>
  <div class="mx-enhance-table">
    <div v-if="$slots.toolbar" class="mx-enhance-table__toolbar">
      <slot name="toolbar" />
    </div>
    <component
      :is="adapter.DataTable"
      :columns="columns"
      :data-source="dataSource"
      :row-key="rowKey"
      :loading="loading"
      :size="size"
      :pagination="pagination"
      :row-selection="rowSelection"
      :expanded-row-keys="expandedRowKeys"
      @page-change="(...args: [number, number]) => emit('pageChange', ...args)"
      @sort-change="(...args: [string, 'asc' | 'desc']) => emit('sortChange', ...args)"
      @row-click="(...args: [Record<string, unknown>, number]) => emit('rowClick', ...args)"
      @update:expanded-row-keys="(...args: [Array<string | number>]) => emit('update:expandedRowKeys', ...args)"
    >
      <template v-if="$slots.bodyCell" #bodyCell="binding">
        <slot name="bodyCell" v-bind="binding" />
      </template>
      <template v-if="$slots.expandedRow" #expandedRow="binding">
        <slot name="expandedRow" v-bind="binding" />
      </template>
      <template #empty>
        <slot name="empty">
          <EmptyState :description="emptyText" />
        </slot>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { useUiAdapter } from '../adapter/key';
import EmptyState from '../EmptyState';
import type { EnhanceTableEmits, EnhanceTableProps } from './types';

withDefaults(defineProps<EnhanceTableProps>(), {
  dataSource: () => [],
  rowKey: 'id',
  loading: false,
  size: 'md',
  pagination: false,
  rowSelection: false,
  expandedRowKeys: undefined,
  emptyText: '暂无数据',
});

const emit = defineEmits<EnhanceTableEmits>();

const adapter = useUiAdapter();
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
