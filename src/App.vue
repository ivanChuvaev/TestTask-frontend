<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Button, Dropdown, Menu, MenuItem } from 'ant-design-vue';
import { DownOutlined } from '@ant-design/icons-vue'
import { useGlobalStore } from './stores/global';
import { useViewMode } from './lib';
const globalStore = useGlobalStore()
const mode = useViewMode();
</script>

<template>
  <main class="wrapper">
    <div :class="{header: true, 'bg-visible': mode === 'inspector'}">
      <Button @click="mode = mode === 'inspector' ? 'viewer' : 'inspector'">
        {{ mode }}
      </Button>
      <Dropdown :value="globalStore.sizeMode">
        <Button>
          {{ globalStore.sizeMode }}
          <DownOutlined />
        </Button>
        <template #overlay>
          <Menu>
            <MenuItem  v-for="item in (['contain', 'vertical', 'horizontal', 'original'] as const)" :key="item" @click="globalStore.sizeMode = item">
              {{ item }}
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>
      <Dropdown :value="globalStore.iconSizeMode" class="last">
        <Button class="mbutton">
          {{ globalStore.iconSizeMode }}
          <DownOutlined />
        </Button>
        <template #overlay>
          <Menu>
            <MenuItem v-for="item in (['small', 'medium', 'large'] as const)" :key="item" @click="globalStore.iconSizeMode = item">
              {{ item }}
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>
    </div>
    <RouterView class="body" />
  </main>
</template>

<style scoped lang="scss">

  .wrapper {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 100%;
    min-width: 100%;
  }
  
  .header {
    z-index: 1;
    display: grid;
    grid-template-columns: min-content auto;
    flex-direction: column;
    gap: 10px;
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    padding: 10px;
    background: transparent;
    opacity: .5;
    transition: opacity 200ms;

    &:hover {
      opacity: 1;
    }

    &.bg-visible {
      background: color-mix(in srgb, var(--color-background), transparent 90%);
      position: sticky;
      opacity: 1;
    }

    &>* {
      width: fit-content;
    }

    .last {
      margin-left: auto;
      grid-column: 1 / span 2;
    }
  }

  .body {
    flex-grow: 1;
    background: transparent;
  }

  .mbutton {
    min-width: 0;
    
  }

  @media screen and (min-width: 300px) {
    .header {
      grid-template-columns: min-content min-content auto; 
      .last {
        grid-column: unset;
      }
    }
  }
</style>
