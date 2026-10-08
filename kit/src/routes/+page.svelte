<script lang="ts">
  import {onMount} from 'svelte'
  import {SvelteSet} from 'svelte/reactivity'
  import {Eraser, NotebookPen, Lightbulb, RotateCcw, ClockPlus} from '@lucide/svelte'
  import {sleep} from '#lib'
  import * as i18n from '#lib/i18n/index.svelte.ts'

  import {decode, duplicate} from './sudoku'


  // svelte-ignore non_reactive_update
  let dialog: HTMLDialogElement

  const {puzzle} = decode('9b7b1a2d9d6_5_4e3e7_2b8b2a5b4b6_4e5e3_7_9d6d2a3b1b5')
  let answers = $state<Array<number | undefined>>(puzzle)
  const levels = ['初级', '中级', '高级', '困难']

  const snap = $state({
    level: 3,
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
    let ok
    for (const x of answers) {
      if (!x) return false
    }
    if (!ok) return false
    ok = errIndices.size === 0
    if (!ok) return false
    return true
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
    if (snap.mode === 'pen') answers[ci] = v
    else if (notes[ci]) {
      const n = notes[ci]
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
    if (ci < 0) return
    if (snap.mode === 'pen') answers[ci] = undefined
    else notes[ci]?.nums.clear()
  }

  $effect(() => {
    const v = notes[ci]
    if (snap.mode === 'pen' && v) {
      v.active = false
    } else {
      if (v) v.active = true
      else notes[ci] = {active: true, nums: new SvelteSet<number>()}
    }
  })

  async function countdown() {
    snap.t++
    await sleep(1)
    countdown()
  }

  function replay() {
    answers = puzzle
    notes = []
  }

  $inspect(finished)

  onMount(() => {
    countdown()
  })
</script>

<main class="p-4">
  <div class="mx-auto max-lg:max-w-120 lg:flex lg:justify-center lg:gap-10">
    <!-- 数独九宫格 -->
    <div class="flex gap-4 relative flex-col lg:w-120">
      <div class="flex items-center justify-between">
        <div class="level" style:--ox={snap.level}>
          {#each levels as x, i}
            <button
              onclick={() => snap.level = i}
              class:active={snap.level === i}
            >{x}</button>
          {/each}
        </div>
        <span class="text-sm font-semibold fvn text-ink-fg font-mono">{tt}</span>
      </div>

      <div style:--bc="#c1a57d70" style:--tc="#aaa0"
        class="grid grid-cols-3 w-full aspect-square gap-[3px] md:gap-[3px] bg-(--bc) border-3 md:border-4 border-(--bc) overflow-hidden rounded-md">
        {#each {length: 9} as _, m}
          {const x1 = m % 3}
          {const y1 = (m / 3) | 0}
          <div class="aspect-square bg-(--tc) grid grid-cols-3 gap-[1px]">
            {#each {length: 9} as _, n}
              {const x2 = n % 3}
              {const y2 = (n / 3) | 0}
              {const x = x1 * 3 + x2}
              {const y = y1 * 3 + y2}
              {const index = y * 9 + x}
              {const v = $derived(answers[index])}
              {const raw = !!puzzle[index]}
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
                  <div class="absolute top-0 left-0 w-full h-full grid grid-cols-3">
                    {#each {length: 9} as _, i}
                      {const v = i + 1}
                      <div class="flex items-center justify-center relative">
                        <span
                          class="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs"
                        >{note.nums.has(v) ? v : ''}</span>
                      </div>
                    {/each}
                  </div>
                {:else}{v ? v : ''}{/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <div class="text-xs flex items-center justify-between bg-gray-50/50 p-3 rounded-md border border-ink-faint/30">
        <button onclick={() => hl.num = !hl.num} style:--bg="#e2dfff">
          <span class="square" class:bg-(--bg)={hl.num}></span>
          <span>数字匹配</span>
        </button>
        <button onclick={() => hl.row = !hl.row} style:--bg="#eceef0">
          <span class="square" class:bg-(--bg)={hl.row}></span>
          <span>行列高亮</span>
        </button>
        <button onclick={() => hl.err = !hl.err} style:--bg="#ffdad6">
          <span class="square" class:bg-(--bg)={hl.err}></span>
          <span>数字冲突</span>
        </button>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="flex flex-col">
      <div class="num-panel">
        {#each {length: 9} as _, i}
          {const v = i + 1}
          <button
            data-num={v}
            disabled={!allowNums.has(v)}
            onclick={click}
            class="num cursor-pointer flex-1 rounded-sm aspect-square bg-ink-bg/80 font-semibold border border-ink-faint/50">{v}</button>
        {/each}
      </div>
      <div class="tool">
        <button title={i18n.t('home.eraser')} onclick={clear}><Eraser size={20}/></button>
        <button title={i18n.t('home.note')}
          class:active={snap.mode === 'note'}
          onclick={() => snap.mode = snap.mode === 'note' ? 'pen' : 'note'}
        ><NotebookPen size={20}/></button>
        <button title="新游戏" onclick={replay}><ClockPlus size={20}/></button>
        <button title="重来" onclick={replay}><RotateCcw size={20}/></button>
      </div>
      <div class="tip text-xs font-semibold">
        <p class="flex items-center gap-2 border-b border-ink-faint/30 pb-3 border-dashed"><Lightbulb size={20} class="text-yellow-500"/><span class="text-sm">操作提示</span></p>
        <p class="mt-4"><span class="mr-2">清空数字</span><kbd>双击</kbd><span class="mx-1">or</span><kbd>Del/退格</kbd></p>
        <p class="mt-4"><span class="mr-2">切换笔记</span><kbd>N</kbd></p>
        <p class="mt-4"><span class="mr-2">填写数字</span><kbd>数字键</kbd></p>
      </div>
    </div>
  </div>
</main>

{#if finished}
<dialog bind:this={dialog} class="rounded-md m-auto shadow-md p-4 w-full max-w-100 border border-ink-faint/30">
  <h1 class="font-semibold text-center">完成数独</h1>
  <p class="text-center text-sm mt-4 flex items-center gap-2 justify-center">
    <span>恭喜🎉</span>
    <span>此次游戏耗时</span>
    <span class="text-orange-500">{tt}</span>
  </p>
  <div class="mt-6 flex items-center gap-4 justify-center">
    <button class="text-xs border border-ink-faint/30 rounded-md py-1 px-3 bg-lime-600 text-white">分享</button>
    <button class="text-xs border border-ink-faint/30 rounded-md py-1 px-3 bg-sky-500 text-white">继续</button>
  </div>
</dialog>
{/if}

<svelte:window
  onkeydown={e => {
    if (ci < 0) return
    switch (e.key) {
      case 'n': {
        snap.mode = snap.mode === 'note' ? 'pen' : 'note'
        break
      }

      case 'Backspace': {
        clear()
        break
      }

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
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
        if (!(e.key >= '0' && e.key <= '9')) return
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

  div:has(>.num-panel) {
    @apply gap-4 mt-4;

    @variant lg {
      @apply rounded-md p-4 h-fit self-center justify-center mt-0;
    }
  }

  .tip {
    @apply border border-ink-faint/30 bg-ink-bg p-4 rounded-md order-2;
  }

  .tool {
    @apply flex items-center justify-center gap-4;

    button {
      @apply block aspect-square border border-ink-faint/50 bg-ink-bg p-1.5 rounded-md text-ink-fg;

      &.active {
        @apply bg-sky-500 text-white border-transparent;
      }
    }

    @variant lg {
      @apply order-0;
    }
  }

  .level {
    @apply relative flex items-center justify-between w-fit p-1 bg-white border border-ink-faint/30 rounded-md;

    &::before {
      --w: calc(25% - var(--spacing)*.5);
      --h: calc(100% - var(--spacing)*2);
      @apply content-[""] w-(--w) h-(--h) absolute top-1 left-1 bg-orange-500/80 rounded-sm -z-0;
      transform: translateX(calc(100% * var(--ox)));
      transition: all .3s ease;
    }

    button {
      @apply py-1.5 px-3 text-xs;

      transform: translateZ(0);
      transition: all .5s ease;

      &.active {
        @apply text-white;
      }
    }
  }

  .num-panel {
    @apply flex items-center justify-between gap-2;
    .num {
      @apply hover:bg-lime-500/80 hover:text-white disabled:bg-zinc-200 disabled:line-through disabled:text-gray-500 disabled:cursor-not-allowed;
    }

    @variant lg {
      @apply grid grid-cols-3 order-1 items-center justify-items-center;

      .num {
        @apply w-10 aspect-square;
      }
    }
  }



  .cell {
    @apply font-raleway! cursor-pointer select-none text-zinc-600 text-xl;
    &[data-rc=true] {
      @apply bg-[#eceef0];
    }

    &[data-num=true] {
      @apply bg-sky-100;
    }

    &[data-active=true]:not([data-raw=true]) {
      @apply bg-green-100;
    }

    &[data-err=true][data-raw=true] {
      @apply border border-pink-500;
    }

    &[data-err=true]:not([data-raw=true]) {
      @apply bg-pink-500/50;
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
