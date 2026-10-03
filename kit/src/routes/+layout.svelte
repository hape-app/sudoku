<script lang="ts">
  import "#tw.css"
  const {children} = $props()
</script>

<nav class="w-full bg-white/50 border-b border-ink-faint/30">
  <div class="h-15 max-w-main mx-auto flex items-center px-4">
    <img src="/logo.svg" alt="sudoku" class="h-2/3 bg-gray-50 rounded-sm border border-ink-faint/30" />
  </div>
</nav>

{@render children()}
