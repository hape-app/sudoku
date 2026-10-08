<script lang="ts">
  import {onMount} from 'svelte'
  import {Languages, User} from '@lucide/svelte'
  import {NEXUS_G} from '$app/env/public'
  import "#tw.css"

  const {children} = $props()

  const BASE_URL = import.meta.env.VITE_BASE_URL

  let dialog: HTMLDialogElement

  function click(e: MouseEvent) {
    const target = e.target as HTMLElement
    const ct = e.currentTarget as HTMLElement

    switch (true) {
      case target === dialog: {
        const r = dialog.getBoundingClientRect()
        const {clientX: x, clientY: y} = e
        const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
        if (!inside) dialog.close()
        break
      }

      case ct.dataset.id === 'login': {
        dialog.showModal()
        break
      }
    }
  }

  onMount(() => {

  })
</script>

<nav class="w-full bg-white/50 border-b border-ink-faint/30">
  <div class="h-15 max-w-main mx-auto flex items-center justify-between px-4 md:px-8">
    <img src="/logo.svg" alt="sudoku" class="h-2/3 bg-gray-50 rounded-sm border border-ink-faint/30" />
    <div class="flex items-center gap-1">
      <button><Languages size={20}/></button>
      <button onclick={click} data-id="login"><User size={20}/></button>
    </div>
  </div>
</nav>

<dialog bind:this={dialog}
  class="m-auto p-4 rounded-md border border-ink-faint/30 shadow-md"
  onclick={click}>
  <a href="{NEXUS_G}/auth/google?url={BASE_URL}/auth" aria-label="google"><img src="/img/google.svg" alt="google"/></a>
</dialog>

{@render children()}

<style lang="scss">
  @reference "#tw.css";

  nav button {
    @apply text-ink-fg hover:bg-sky-300 hover:text-white p-2 rounded-full;
  }
</style>
