<script setup lang="ts">
import Inspector from '@/components/Inspector.vue'
import ImageViewer from '@/components/ImageViewer.vue';
import { useQuery } from "@tanstack/vue-query";
import { computed } from 'vue';
import { usePath } from '@/lib'
import { useViewMode } from '@/lib';

const viewMode = useViewMode()
const path = usePath()

const query = useQuery(
  [path],
  async () => {
    const response = await fetch(`${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT}/get-content?path=${path.value}`)
    const responseParsed = await response.json();
    if (response.status !== 200) {
      throw new Error(JSON.stringify(responseParsed))
    }
    return responseParsed
  },
  {
    retry: false,
    refetchOnWindowFocus: false,
    onError: (e: any) => {
      const newPickedPath = path.value.replace(/\/[^\/]*$/, '')
      if (newPickedPath !== path.value) {
        path.value = newPickedPath;
        alert(e);
      }
    }
  }
)

const directories = computed<string[]>(() => {
  if (query.data.value === undefined) return []
  return query.data.value.directories
})
const files = computed<string[]>(() => {
  if (query.data.value === undefined) return []
  return query.data.value.files
})
const images = computed(() => {
  return files.value.filter(v => {
    const match = v.match(/.+\.([^\.]+)$/)
    if (match === null) return false
    const ext = match[1]
    return ['jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'png', 'gif', 'webp', 'tiff', 'tif', 'raw', 'bmp', 'dib'].includes(ext)
  })
})

</script>

<template>
  <main>
    <Inspector v-if="viewMode === 'inspector'" :directories="directories" :images="images" :is-fetching="query.isFetching.value"/>
    <ImageViewer v-if="viewMode !== 'inspector'" :directories="directories" :images="images" :is-fetching="query.isFetching.value" />
  </main>
</template>
