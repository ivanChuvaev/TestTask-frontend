import { computed, nextTick } from 'vue'
import { useRouter, type LocationQuery } from 'vue-router';

type MyQueryStorage = {
  viewMode: 'inspector' | 'viewer'
  path: string
  selected: string
}

const newValue = { v: {} as Partial<MyQueryStorage> }
const isNextTickSet = { v: false }

export function useQueryStore() {
  const router = useRouter()
  const value = computed<MyQueryStorage>(() => ({
    viewMode: (router.currentRoute.value.query['viewMode'] as any) ?? 'inspector',
    path: (router.currentRoute.value.query['path'] as any) ?? '',
    selected: (router.currentRoute.value.query['selected'] as any) ?? '',
  }))

  function update(v: Partial<MyQueryStorage>) {
    newValue.v = { ...newValue.v, ...v }
    if (!isNextTickSet.v) {
      isNextTickSet.v = true
      nextTick(() => {
        const newValueNormalized: LocationQuery = {}
        Object.keys(newValue.v).filter(key => newValue.v[key as keyof MyQueryStorage] !== undefined).map(key => newValueNormalized[key] = newValue.v[key as keyof MyQueryStorage] as string)
        router.push({ query: { ...router.currentRoute.value.query, ...newValueNormalized } })
        isNextTickSet.v = false
        newValue.v = {}
      })
    }
  }

  return { value, update }
}

export function useViewMode() {
  const queryStore = useQueryStore();
  const viewMode = computed({
    get: () => queryStore.value.value.viewMode,
    set: (viewMode: typeof queryStore.value.value['viewMode']) => queryStore.update({ viewMode })
  })
  return viewMode;
}

export function usePath() {
  const queryStore = useQueryStore();
  const path = computed({
    get: () => queryStore.value.value.path,
    set: (path: typeof queryStore.value.value['path']) => queryStore.update({ path })
  })
  return path;
}

export function useSelected() {
  const queryStore = useQueryStore();
  const selected = computed({
    get: () => queryStore.value.value.selected,
    set: (selected: typeof queryStore.value.value['selected']) => queryStore.update({ selected })
  })
  return selected;
}
