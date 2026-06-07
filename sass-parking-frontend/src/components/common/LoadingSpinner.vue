<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  text: '',
});

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <div :class="sizeClasses[size]" class="animate-spin rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-emerald-600"></div>
    <span v-if="text" class="text-slate-500 dark:text-slate-400">{{ text }}</span>
  </div>
</template>
