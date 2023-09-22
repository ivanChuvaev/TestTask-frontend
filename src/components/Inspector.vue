<script setup lang="ts">
import { Spin, Typography } from 'ant-design-vue';
import { usePath, useSelected } from '@/lib'
import { useGlobalStore } from '@/stores/global';
import { useViewMode } from '@/lib';
const props = defineProps<{
  directories: string[]
  images: string[]
  isFetching: boolean
}>()
const globalStore = useGlobalStore();
const backendUrl = `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT}`
const path = usePath()
const selected = useSelected();
const viewMode = useViewMode();
</script>

<template>
  <main :class="'wrapper' + ' ' + globalStore.iconSizeMode">
    <div v-show="isFetching" class="loading">
      <Spin />
    </div>
    <div :class="{ list: true, 'list-loading': isFetching }">
      <div v-if="path !== ''" @click="path = path.replace(/\/[^\/]*$/, '')" class="directory" title="previous directory">
        <img src="/empty-folder.png">
        <Typography.Paragraph :ellipsis="{ rows: 2 }" class="text" content=".." />
      </div>
      <div v-for="directory in directories" :key="directory" @click="path = `${path}/${directory}`" class="directory" :title="directory">
        <img src="/empty-folder.png">
        <Typography.Paragraph :ellipsis="{ rows: 2 }" class="text" :content="directory" />
      </div>
      <div v-for="image in images" :key="image" class="image" :title="image" @click="selected = image; viewMode = 'viewer'">
        <img :src="`${backendUrl}/${path}/${image}`" loading="lazy">
        <Typography.Paragraph :ellipsis="{ rows: 2 }" class="text" :content="image" />
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@use './item-mixin.scss';

.wrapper {
  @include item-mixin.item-size-provider();
  padding: 10px;
  padding-top: 0;
  min-width: 100%;
  min-height: 100%;
  background: transparent;
  position: relative;

}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}


.list {
  display: grid;
  align-items: center;
  justify-items: center;
  gap: 4px;
  padding: 0;

  
  &>* {
    list-style-position: inside;
    &::marker {
      width: 100px;
    }
  }

  &.list-loading {
    opacity: .5;
  }
}

.image {
  @include item-mixin.item();
  width: 100%;
}

.directory {
  @include item-mixin.item();
  width: 100%;

  .text {
    color: red;
  }
}

</style>