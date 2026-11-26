<template>
  <component
    :is="adapter.Modal"
    v-bind="props"
    @update:open="(v: boolean) => emit('update:open', v)"
    @ok="emit('ok')"
    @cancel="emit('cancel')"
  >
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { useUiAdapter } from '../adapter/key';
import type { MxDialogEmits, MxDialogProps } from './types';

const props = withDefaults(defineProps<MxDialogProps>(), {
  open: false,
  title: '',
  width: 520,
  footer: true,
  maskClosable: true,
  destroyOnClose: true,
});

const emit = defineEmits<MxDialogEmits>();

const adapter = useUiAdapter();
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
