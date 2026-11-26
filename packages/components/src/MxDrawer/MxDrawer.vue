<template>
  <component
    :is="adapter.Drawer"
    v-bind="props"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { useUiAdapter } from '../adapter/key';
import type { MxDrawerEmits, MxDrawerProps } from './types';

const props = withDefaults(defineProps<MxDrawerProps>(), {
  open: false,
  title: '',
  width: 520,
  destroyOnClose: true,
});

const emit = defineEmits<MxDrawerEmits>();

const adapter = useUiAdapter();
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
