import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', () => ({
  sizeMode: ref<'contain' | 'vertical' | 'horizontal' | 'original'>('contain'),
  iconSizeMode: ref<'small' | 'medium' | 'large'>('small')
}),
{
  persist: true,
})
