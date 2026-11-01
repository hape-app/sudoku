<script lang="ts">
  import {onMount} from 'svelte'
  import {SvelteSet} from 'svelte/reactivity'
  import {ClockPlus, Eraser, Lightbulb, LoaderCircle, NotebookPen, RotateCcw} from '@lucide/svelte'
  import {getPuzzle} from '#api'
  import {toast} from '#lib'
  import * as i18n from '#lib/i18n/index.svelte.ts'

  import {decode, duplicate} from './sudoku'

  // svelte-ignore non_reactive_update
  let dialog: HTMLDialogElement

  function emptyBoard() {
    return Array<number | undefined>(81).fill(undefined)
  }

  let puzzle = $state.raw(emptyBoard())
  let answers = $state(emptyBoard())
  let puzzleNumber = $state<number | null>(null)
  let loading = $state(true)
  let requestVersion = 0

  const levels = [
    {label: 'level0', value: 'beginner'},
    {label: 'level1', value: 'intermediate'},
    {label: 'level2', value: 'advanced'},
    {label: 'level3', value: 'expert'},
  ] as const

  const snap = $state({
    level: 0,
    t: 0,
    mode: 'pen' as 'pen' | 'note'
  })

  let current = $state.raw({x: -1, y: -1})
  let notes = $state<{active: boolean, nums: Set<number>}[]>([])
  const ci = $derived(current.y * 9 + current.x)

  const errIndices = $derived(duplicate(answers))
  const numIndices = $derived.by(() => {
    const r = new Set()
    if (current.x === -1) return r
    const i = ci
    const v = answers[i]
    if (!v) return r
    for (let i = 0; i < answers.length; i++) {
      if (v === answers[i]) r.add(i)
    }
    return r
  })

  // 是否完成
  const finished = $derived.by(() => {
    if (answers.length < 81) return false
    for (let i = 0; i < 81; i++) {
      if (!answers[i]) return false
    }
    return errIndices.size === 0
  })
  // 自动判断无法输入的数字
  const allowNums = $derived.by(() => {
    let r = new Set()
    if (current.x === -1) return r
    // 如果当前在默认数字格上
    if (puzzle[ci]) return r

    // 开始时所有数字可填
    for (let i = 1; i < 10; i++) r.add(i)

    // 笔记模式不限制数字
    if (snap.mode === 'note') return r

    const bx = (current.x / 3 | 0) * 3
    const by = (current.y / 3 | 0) * 3
    for (let i = 0; i < 9; i++) {
      let v
      let ix = current.y * 9 + i
      v = answers[ix]
      v && r.delete(v)
      let iy = i * 9 + current.x
      v = answers[iy]
      v && r.delete(v)
      ix = bx + (i % 3)
      iy = by + (i / 3 | 0)
      v = answers[ix + iy * 9]
      v && r.delete(v)
    }
    return r
  })

  // 统计每个数字 1-9 剩余可填数量
  const remainNums = $derived.by(() => {
    const counts = Array(10).fill(9)
    for (let i = 0; i < 81; i++) {
      const v = answers[i]
      if (v && v >= 1 && v <= 9 && !errIndices.has(i)) {
        counts[v] = Math.max(0, counts[v] - 1)
      }
    }
    return counts
  })

  const tt = $derived.by(() => {
    let t = snap.t
    const m = t / 60 | 0
    t -= m * 60
    return `${`${m}`.padStart(2, '0')}:${`${t}`.padStart(2, '0')}`
  })

  const hl = $state({
    num: true,
    row: true,
    err: true,
  })

  function input(v: number) {
    if (loading || ci < 0 || puzzle[ci] || v < 1 || v > 9) return
    if (snap.mode === 'pen') {
      answers[ci] = v
      if (notes[ci]) notes[ci].active = false
      const bx = (current.x / 3 | 0) * 3
      const by = (current.y / 3 | 0) * 3
      for (let i = 0; i < 9; i++) {
        notes[current.y * 9 + i]?.nums.delete(v)
        notes[i * 9 + current.x]?.nums.delete(v)
        notes[(by + (i / 3 | 0)) * 9 + bx + (i % 3)]?.nums.delete(v)
      }
    } else {
      answers[ci] = undefined
      let n = notes[ci]
      if (!n) {
        n = {active: true, nums: new SvelteSet<number>()}
        notes[ci] = n
      } else {
        n.active = true
      }
      if (n.nums.has(v)) n.nums.delete(v)
      else n.nums.add(v)
    }
  }

  function click(e: MouseEvent) {
    const ct = e.currentTarget as HTMLElement

    switch (true) {
      case ct.classList.contains('cell'): {
        const x = +ct.dataset.x!
        const y = +ct.dataset.y!
        current = {x, y}
        break
      }

      case !!ct.dataset.num: {
        if (ci < 0) return
        input(+ct.dataset.num)
        break
      }
    }

  }

  function clear() {
    if (loading || ci < 0 || puzzle[ci]) return
    if (snap.mode === 'pen') answers[ci] = undefined
    else notes[ci]?.nums.clear()
  }

  function replay() {
    if (loading) return
    answers = [...puzzle]
    notes = []
    current = {x: -1, y: -1}
    snap.t = 0
    dialog?.close()
  }

  async function newGame(level = snap.level) {
    const selected = levels[level]
    const version = ++requestVersion

    snap.level = level
    loading = true
    puzzle = emptyBoard()
    answers = emptyBoard()
    puzzleNumber = null
    notes = []
    current = {x: -1, y: -1}
    snap.t = 0
    dialog?.close()

    try {
      const data = await getPuzzle(selected.value)
      if (version !== requestVersion) return

      const next = decode(data.task).puzzle
      if (next.length !== 81) throw new Error('Invalid puzzle data')

      puzzle = next
      answers = [...next]
      puzzleNumber = data.number

      const actual = levels.findIndex(item => item.value === data.level)
      if (actual >= 0) snap.level = actual
      if (actual >= 0 && actual !== level) {
        toast(i18n.t('home.levelUnavailable', {
          level: i18n.t(`home.${selected.label}`),
          actual: i18n.t(`home.${levels[actual].label}`),
        }))
      }
    } catch (e) {
      if (version !== requestVersion) return
      toast(e instanceof Error ? e : new Error(String(e)))
    } finally {
      if (version === requestVersion) loading = false
    }
  }

  async function share() {
    const levelName = i18n.t(`home.${levels[snap.level].label}`)
    const text = `${i18n.t('layout.title')} (${levelName}) - ${tt} ${location.href}`
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      toast(i18n.t('home.shareCopied'), 'success')
    }
  }

  $effect(() => {
    if (finished && dialog && !dialog.open) {
      dialog.showModal()
    }
  })

  onMount(() => {
    void newGame(0)

    const tid = setInterval(() => {
      if (!finished && !loading) snap.t++
    }, 1e3)
    return () => clearInterval(tid)
  })
</script>

<main class="p-4">
  <div class="mx-auto max-lg:max-w-120 lg:flex lg:items-start lg:justify-center lg:gap-8">
    <!-- 数独九宫格 -->
    <div class="flex gap-3.5 relative flex-col lg:w-120">
      <div class="flex items-center justify-between">
        <div class="level" style:--ox={snap.level}>
          {#each levels as item, i (item.value)}
            <button
              onclick={() => newGame(i)}
              class:active={snap.level === i}
              aria-pressed={snap.level === i}
            >{i18n.t(`home.${item.label}`)}</button>
          {/each}
        </div>
        <div class="flex flex-col items-center gap-1 bg-ink-bg px-2.5 py-1 rounded-md border border-ink-faint/30">
          <span class="text-sm leading-none font-semibold fvn text-ink-fg font-mono">{tt}</span>
          <span class="text-[10px] leading-none fvn text-muted">
            {puzzleNumber ? i18n.t('home.puzzleNo', {number: puzzleNumber}) : '—'}
          </span>
        </div>
      </div>

      <div style:--bc="#c1a57d70" style:--tc="#aaa0"
        class="grid grid-cols-3 w-full aspect-square gap-[3px] md:gap-[3px] bg-(--bc) border-3 md:border-4 border-(--bc) overflow-hidden rounded-md shadow-xs relative"
        aria-busy={loading}>
        {#each {length: 9} as _, m (m)}
          {const x1 = m % 3}
          {const y1 = (m / 3) | 0}
          <div class="aspect-square bg-(--tc) grid grid-cols-3 gap-[1px]">
            {#each {length: 9} as _, n (n)}
              {const x2 = n % 3}
              {const y2 = (n / 3) | 0}
              {const x = x1 * 3 + x2}
              {const y = y1 * 3 + y2}
              {const index = y * 9 + x}
              {const v = $derived(answers[index])}
              {const raw = $derived(!!puzzle[index])}
              {const note = $derived(notes[index])}
              <div class="aspect-square bg-white relative cell flex items-center justify-center font-semibold"
                onclick={click}
                role="button"
                ondblclick={raw ? null : clear}
                tabindex="0"
                data-raw={raw}
                data-rc={hl.row && (x === current.x || y === current.y)}
                data-err={hl.err && errIndices.has(index)}
                data-num={hl.num && numIndices.has(index)}
                data-active={index === current.y * 9 + current.x}
                onkeydown={() => {}}
                data-x={x}
                data-y={y}>
                {#if note && note.active && note.nums.size}
                  <div class="absolute inset-0.5 grid grid-cols-3">
                    {#each {length: 9} as _, i (i)}
                      {const v = i + 1}
                      <div class="flex items-center justify-center relative">
                        <span
                          class="absolute inset-0 flex items-center justify-center text-[11px] leading-none text-ink-fg/80 font-medium"
                        >{note.nums.has(v) ? v : ''}</span>
                      </div>
                    {/each}
                  </div>
                {:else}{v ? v : ''}{/if}
              </div>
            {/each}
          </div>
        {/each}
        {#if loading}
          <div class="absolute inset-0 z-20 flex items-center justify-center bg-white/65 backdrop-blur-[1px]" role="status" aria-live="polite">
            <LoaderCircle class="animate-spin text-orange-500" size={28}/>
            <span class="sr-only">{i18n.t('home.loading')}</span>
          </div>
        {/if}
      </div>

      <div class="text-xs flex items-center justify-between bg-ink-bg/80 px-3.5 py-2.5 rounded-md border border-ink-faint/30 text-ink-fg">
        <button onclick={() => hl.num = !hl.num} style:--bg="#dbeafe">
          <span class="square" class:bg-(--bg)={hl.num}></span>
          <span>{i18n.t('home.matchNum')}</span>
        </button>
        <button onclick={() => hl.row = !hl.row} style:--bg="#eceef0">
          <span class="square" class:bg-(--bg)={hl.row}></span>
          <span>{i18n.t('home.highlightRC')}</span>
        </button>
        <button onclick={() => hl.err = !hl.err} style:--bg="#ffdad6">
          <span class="square" class:bg-(--bg)={hl.err}></span>
          <span>{i18n.t('home.conflict')}</span>
        </button>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="side-panel flex flex-col lg:w-60">
      <div class="tool">
        <button title={i18n.t('home.eraser')} onclick={clear}>
          <Eraser size={18}/>
          <span>{i18n.t('home.eraser')}</span>
        </button>
        <button title={i18n.t('home.note')}
          class:active={snap.mode === 'note'}
          onclick={() => snap.mode = snap.mode === 'note' ? 'pen' : 'note'}
        >
          <NotebookPen size={18}/>
          <span>{i18n.t('home.note')}</span>
        </button>
        <button title={i18n.t('home.newGame')} onclick={() => newGame()}>
          <ClockPlus size={18}/>
          <span>{i18n.t('home.newGame')}</span>
        </button>
        <button title={i18n.t('home.replay')} onclick={replay}>
          <RotateCcw size={18}/>
          <span>{i18n.t('home.replay')}</span>
        </button>
      </div>
      <div class="num-panel">
        {#each {length: 9} as _, i (i)}
          {const v = i + 1}
          {const rem = $derived(remainNums[v])}
          <button
            data-num={v}
            disabled={loading || !allowNums.has(v)}
            onclick={click}
            class="num cursor-pointer min-h-11 rounded-md bg-ink-bg font-semibold border border-ink-faint/40 flex flex-col items-center justify-center py-2 lg:py-3 shadow-2xs transition-colors">
            <span class="text-base lg:text-xl leading-none">{v}</span>
            <span class="text-[10px] leading-none mt-1 opacity-55 fvn font-normal">{rem}</span>
          </button>
        {/each}
      </div>
      <div class="tip text-xs font-semibold max-lg:hidden">
        <p class="flex items-center gap-2 border-b border-ink-faint/30 pb-3 border-dashed"><Lightbulb size={20} class="text-yellow-500"/><span class="text-sm">{i18n.t('home.tips')}</span></p>
        <p class="mt-4"><span class="mr-2">{i18n.t('home.clearNum')}</span><kbd>{i18n.t('home.dblclick')}</kbd><span class="mx-1">or</span><kbd>{i18n.t('home.delBackspace')}</kbd></p>
        <p class="mt-4"><span class="mr-2">{i18n.t('home.toggleNote')}</span><kbd>N</kbd></p>
        <p class="mt-4"><span class="mr-2">{i18n.t('home.fillNum')}</span><kbd>{i18n.t('home.numKeys')}</kbd></p>
      </div>
    </div>
  </div>
</main>

{#if finished}
<dialog bind:this={dialog} class="rounded-md m-auto shadow-md p-4 w-full max-w-100 border border-ink-faint/30">
  <h1 class="font-semibold text-center">{i18n.t('home.completed')}</h1>
  <p class="text-center text-sm mt-4 flex items-center gap-2 justify-center">
    <span>{i18n.t('home.congrats')}</span>
    <span>{i18n.t('home.timeSpent')}</span>
    <span class="text-orange-500">{tt}</span>
  </p>
  <div class="mt-6 flex items-center gap-4 justify-center">
    <button onclick={share} class="text-xs border border-ink-faint/30 rounded-md py-1 px-3 bg-lime-600 text-white">{i18n.t('home.share')}</button>
    <button onclick={() => newGame()} class="text-xs border border-ink-faint/30 rounded-md py-1 px-3 bg-sky-500 text-white">{i18n.t('home.continue')}</button>
  </div>
</dialog>
{/if}

<svelte:window
  onkeydown={e => {
    if (finished || loading) return
    switch (e.key) {
      case 'n':
      case 'N': {
        snap.mode = snap.mode === 'note' ? 'pen' : 'note'
        break
      }

      case 'Backspace':
      case 'Delete':
      case '0': {
        clear()
        break
      }

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault()
        if (current.x === -1) {
          current = {x: 0, y: 0}
          break
        }
        let y = current.y + (e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0)
        let x = current.x + (e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0)
        if (x < 0) x = 0
        else if (x > 8) x = 8
        if (y < 0) y = 0
        else if (y > 8) y = 8
        current = {x, y}
        break
      }

      default: {
        if (ci < 0) return
        if (!(e.key >= '1' && e.key <= '9')) return
        input(+e.key)
      }
    }
  }}
/>

<style lang="scss">
  @reference "#tw.css";

  kbd {
    @apply text-xs text-ink-fg;
  }

  .side-panel {
    @apply gap-3.5 mt-3.5;

    @variant lg {
      @apply h-fit justify-center mt-13;
    }
  }

  .tip {
    @apply border border-ink-faint/30 bg-ink-bg p-4 rounded-md text-ink-fg;
  }

  .tool {
    @apply grid grid-cols-4 gap-2;

    button {
      @apply flex flex-col items-center justify-center gap-1 border border-ink-faint/40 bg-ink-bg py-2 px-1 rounded-md text-ink-fg text-[11px] font-medium hover:border-ink-faint transition-colors;

      &.active {
        @apply bg-sky-500 text-white border-transparent;
      }
    }
  }

  .level {
    @apply relative grid grid-cols-4 w-fit p-1 bg-ink-bg border border-ink-faint/30 rounded-md;

    &::before {
      --w: calc((100% - var(--spacing)*2) / 4);
      --h: calc(100% - var(--spacing)*2);
      @apply content-[""] w-(--w) h-(--h) absolute top-1 left-1 bg-orange-500/80 rounded-sm -z-0;
      transform: translateX(calc(100% * var(--ox)));
      transition: all .3s ease;
    }

    button {
      @apply py-1.5 px-3 text-xs text-center text-ink-fg font-medium;

      transform: translateZ(0);
      transition: all .5s ease;

      &.active {
        @apply text-white;
      }
    }
  }

  .num-panel {
    @apply grid grid-cols-3 gap-2;
    .num {
      @apply text-ink-fg hover:bg-lime-600/85 hover:text-white hover:border-transparent disabled:bg-zinc-200/70 disabled:line-through disabled:text-gray-400 disabled:cursor-not-allowed;
    }
  }



  .cell {
    @apply font-raleway! cursor-pointer select-none text-zinc-600 text-xl;
    &[data-rc=true] {
      @apply bg-[#eceef0];
    }

    &[data-num=true] {
      @apply bg-[#dbeafe];
    }

    &[data-active=true][data-raw=true] {
      @apply bg-amber-100/80;
    }

    &[data-active=true]:not([data-raw=true]) {
      @apply bg-green-100;
    }

    &[data-err=true][data-raw=true] {
      @apply bg-rose-100/70 border border-pink-500;
    }

    &[data-err=true]:not([data-raw=true]) {
      @apply bg-[#ffdad6] text-rose-700;
    }

    &:not([data-raw=true]) {
      @apply text-sky-500;
    }
  }

  .square {
    @apply w-3 aspect-square block rounded-xs border border-ink-faint;
  }

  button:has(.square) {
    @apply flex items-center gap-1;
  }
</style>
