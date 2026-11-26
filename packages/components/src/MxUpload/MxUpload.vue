<template>
  <component :is="adapter.Upload" v-bind="uploadProps" @update:file-list="handleFileList">
    <slot>
      <component :is="adapter.Button">
        上传文件
      </component>
    </slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUiAdapter } from '../adapter/key';
import type { MxUploadEmits, MxUploadProps } from './types';

const props = withDefaults(defineProps<MxUploadProps>(), {
  action: undefined,
  accept: undefined,
  multiple: false,
  maxCount: undefined,
  disabled: false,
  fileList: () => [],
});

const emit = defineEmits<MxUploadEmits>();

const adapter = useUiAdapter();

// action 为空串时交由适配器 props 默认值处理，避免显式传 undefined 触发告警
const uploadProps = computed(() => ({ ...props, action: props.action ?? '' }));

function handleFileList(fileList: MxUploadProps['fileList']): void {
  emit('update:fileList', fileList ?? []);
}
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
