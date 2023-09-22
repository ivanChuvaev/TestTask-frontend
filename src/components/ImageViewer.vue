<script setup lang="ts">
import { Spin, Typography } from 'ant-design-vue';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useElementSize } from '@vueuse/core'
import { useSelected, usePath } from '@/lib'
import { useGlobalStore } from '@/stores/global';
const props = defineProps<{
  directories: string[]
  images: string[]
  isFetching: boolean
}>()
const imageRef = ref<HTMLSourceElement | null>(null)
const canvasWrapperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapperSize = useElementSize(canvasWrapperRef)
const globalStore = useGlobalStore();
const path = usePath();
const selected = useSelected();
const backendUrl = `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT}`
const canvasState = {
  ctx: null as null | CanvasRenderingContext2D,
  cameraOffset: { x: 0, y: 0 },
  cameraZoom: 1,
  MAX_ZOOM: 5,
  MIN_ZOOM: 0.1,
  SCROLL_SENSITIVITY: 0.0005
}

const img = new Image();
img.onload = (e) => render()
img.onerror = (e) => { selected.value = '' }

const sizeMode = computed(() => globalStore.sizeMode);

watch(computed(() => props.images), () => {
  if (props.images.length === 0) {
    selected.value = ''
  } else {
    selected.value = props.images[0];
  }
})

watch([selected, computed(() => props.images)], () => {
  nextTick(() => document.querySelector('.image.selected')?.scrollIntoView({ behavior: 'smooth' }))
  if (selected.value !== '') {
    img.src = `${backendUrl}/${path.value}/${selected.value}`
  }
  resetCanvasTransform();
  render();
}, { immediate: true })

watch(sizeMode, () => {
  resetCanvasTransform();
  render();
})

function resetCanvasTransform () {
  canvasState.cameraOffset = { x: 0, y: 0 }
  canvasState.cameraZoom = 1;
}

function render () {
  const ctx = canvasState.ctx;
  if (ctx !== null && canvasRef.value !== null) {
    ctx.resetTransform()
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    ctx.translate( canvasRef.value.width / 2, canvasRef.value.height / 2 )
    ctx.scale(canvasState.cameraZoom, canvasState.cameraZoom)
    ctx.translate( -canvasRef.value.width / 2 + canvasState.cameraOffset.x, -canvasRef.value.height / 2 + canvasState.cameraOffset.y )
    const canvasAspect = canvasRef.value.height / canvasRef.value.width;
    const imgAspect = img.height / img.width
    const imgNexSize = {
      width: img.width,
      height: img.height
    }
    if (globalStore.sizeMode === 'contain') {
      if (imgAspect > canvasAspect) {
        imgNexSize.width = canvasRef.value.height / imgAspect
        imgNexSize.height = canvasRef.value.height
      } else {
        imgNexSize.width = canvasRef.value.width
        imgNexSize.height = canvasRef.value.width * imgAspect
      }
    }
    if (globalStore.sizeMode === 'horizontal') {
      imgNexSize.width = canvasRef.value.width
      imgNexSize.height = canvasRef.value.width * imgAspect
    }
    if (globalStore.sizeMode === 'vertical') {
      imgNexSize.width = canvasRef.value.height / imgAspect
      imgNexSize.height = canvasRef.value.height
    }
    if (globalStore.sizeMode === 'original') {
      
    }
    if (selected.value !== '') {
      ctx.drawImage(
        img,
        (canvasRef.value.width - imgNexSize.width) / 2,
        (canvasRef.value.height - imgNexSize.height) / 2,
        imgNexSize.width, imgNexSize.height
      )
    }
  }
}

watch(canvasRef, () => {
  if (canvasRef.value !== null) {
    canvasState.ctx = canvasRef.value.getContext('2d')!;
    canvasState.ctx.imageSmoothingEnabled = true;
    function getEventLocation(e: MouseEvent | TouchEvent)
    {
      if ('touches' in e && e.touches.length == 1){
        return { x:e.touches[0].clientX, y: e.touches[0].clientY }
      }
      else if ('clientX' in e && e.clientY){
        return { x: e.clientX, y: e.clientY }        
      }
      throw new Error('getEventLocation recieved invalid e')
    }

    let isDragging = false
    let dragStart = { x: 0, y: 0 }

    function onPointerDown(e: MouseEvent | TouchEvent)
    {
      isDragging = true
      dragStart.x = getEventLocation(e).x/canvasState.cameraZoom - canvasState.cameraOffset.x
      dragStart.y = getEventLocation(e).y/canvasState.cameraZoom - canvasState.cameraOffset.y
    }

    function onPointerUp(e: MouseEvent | TouchEvent)
    {
      isDragging = false
      initialPinchDistance = null
      lastZoom = canvasState.cameraZoom
    }

    function onPointerMove(e: MouseEvent | TouchEvent)
    {
      if (isDragging){
        canvasState.cameraOffset.x = getEventLocation(e).x/canvasState.cameraZoom - dragStart.x
        canvasState.cameraOffset.y = getEventLocation(e).y/canvasState.cameraZoom - dragStart.y
      }
      render();
    }

    function handleTouch(e: TouchEvent, singleTouchHandler: (e: MouseEvent | TouchEvent) => void )
    {
      if ( e.touches.length == 1 ){
        singleTouchHandler(e)
      }
      else if (e.type == "touchmove" && e.touches.length == 2){
        isDragging = false
        handlePinch(e)
      }
    }

    let initialPinchDistance: number | null = null
    let lastZoom = canvasState.cameraZoom

    function handlePinch(e: TouchEvent){
        e.preventDefault()
        
        let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
        
        // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
        let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2
        
        if (initialPinchDistance == null) {
            initialPinchDistance = currentDistance
        } else {
            adjustZoom( null, currentDistance/initialPinchDistance )
        }
    }

    function adjustZoom(zoomAmount: number | null, zoomFactor?: number | null){
      if (!isDragging) {
        if (zoomAmount !== null){
          canvasState.cameraZoom -= zoomAmount
        }
        else if (zoomFactor !== null && zoomFactor !== undefined) {
          canvasState.cameraZoom = zoomFactor*lastZoom
        }
        canvasState.cameraZoom = Math.min( canvasState.cameraZoom, canvasState.MAX_ZOOM )
        canvasState.cameraZoom = Math.max( canvasState.cameraZoom, canvasState.MIN_ZOOM )
      }
      render();
    }

    canvasRef.value.addEventListener('mousedown', onPointerDown)
    canvasRef.value.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown), { passive: false })
    canvasRef.value.addEventListener('mouseup', onPointerUp)
    canvasRef.value.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp))
    canvasRef.value.addEventListener('mousemove', onPointerMove)
    canvasRef.value.addEventListener('touchmove', (e) => {handleTouch(e, onPointerMove); e.preventDefault()}, { passive: false })
    canvasRef.value.addEventListener('wheel', (e) => adjustZoom(e.deltaY * canvasState.SCROLL_SENSITIVITY), { passive: false })
  }
})

function updateCanvasSize () {
  canvasRef.value!.width = canvasWrapperRef.value!.clientWidth
  canvasRef.value!.height = canvasWrapperRef.value!.clientHeight
  render();
}

watch([canvasWrapperSize.width, canvasWrapperSize.height], () => {
  updateCanvasSize();
})

onMounted(() => {
  window.addEventListener('resize', updateCanvasSize)
  updateCanvasSize();
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
})
</script>

<template>
  <main :class="'wrapper' + ' ' + globalStore.iconSizeMode">
    <div ref="canvasWrapperRef" class="canvas-wrapper">
      <source ref="imageRef" :src="`${backendUrl}/${path}/${selected}`">
      <canvas ref="canvasRef" :width="500" height="500"></canvas>
    </div>
    <div class="selector">
      <div v-if="path !== ''" @click="path = path.replace(/\/[^\/]*$/, '')" class="directory" title="previous directory">
        <img src="/empty-folder.png">
        <Typography.Paragraph :ellipsis="{ rows: 2 }" class="text" content=".." />
      </div>
      <div v-for="directory in directories" :key="directory" @click="path = `${path}/${directory}`" class="directory" :title="directory">
        <img src="/empty-folder.png">
        <Typography.Paragraph :ellipsis="{ rows: 2 }" class="text" :content="directory" />
      </div>
      <div v-for="image in images" :key="image" :class="{image: true, selected: image === selected}" :title="image" @click="selected = image">
        <img :src="`${backendUrl}/${path}/${image}`" loading="lazy">
        <Typography.Paragraph :ellipsis="{ rows: 2 }" class="text" :content="image" />
      </div>
      <div v-if="isFetching" class="selector-loading">
        <Spin />
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
  @use './item-mixin.scss';
  
  .wrapper {
    @include item-mixin.item-size-provider();
    background: var(--color-background-mute);
    min-height: 100%;
    min-width: 100%;
    display: flex;
    flex-direction: column;
  }

  .canvas-wrapper {
    position: relative;
    flex-grow: 1;
    min-height: 0;
    min-width: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;

    canvas {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }
  }

  .selector {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 5px;
    gap: 5px;
    background: var(--color-background-soft);
    overflow: auto;
    overflow-x: scroll;
    position: relative;
  }

  .selector-loading {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #ffffff3a;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image {
    @include item-mixin.item();
    width: min-content;
    &.selected {
      background: color-mix(in srgb, var(--color-primary) 50%, var(--color-background));
    }
  }

  .directory {
    @include item-mixin.item();
    width: min-content;
    .text {
      color: red;
    }
  }
</style>