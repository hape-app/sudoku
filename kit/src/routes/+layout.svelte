<script lang="ts">
  import {Languages, User} from '@lucide/svelte'
  import "#tw.css"
  const {children} = $props()
</script>

<nav class="w-full bg-white/50 border-b border-ink-faint/30">
  <div class="h-15 max-w-main mx-auto flex items-center justify-between px-4 md:px-8">
    <img src="/logo.svg" alt="sudoku" class="h-2/3 bg-gray-50 rounded-sm border border-ink-faint/30" />
    <div class="flex items-center gap-1">
      <button><Languages size={20}/></button>
      <button><User size={20}/></button>
    </div>
  </div>
</nav>

{@render children()}

<style lang="scss">
  @reference "#tw.css";

  nav button {
    @apply text-ink-fg hover:bg-sky-300 hover:text-white p-2 rounded-full;
  }
</style>
