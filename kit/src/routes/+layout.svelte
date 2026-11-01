<script lang="ts">
  import {onMount} from 'svelte'
  import {Languages, LogOut, User} from '@lucide/svelte'
  import {Toaster} from 'svelte-sonner'
  import {NEXUS_G} from '$app/env/public'
  import {getMe} from '#api'
  import * as i18n from '#lib/i18n/index.svelte.ts'
  import type {Profile} from '#lib'
  import '#tw.css'

  const {children} = $props()

  const BASE_URL = import.meta.env.VITE_BASE_URL

  let dialog: HTMLDialogElement
  let profile = $state<Profile | null>(null)

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

  function login(e: MouseEvent) {
    e.preventDefault()
    // Nexus appends ?data= verbatim, so the callback URL must stay query-free.
    const encoded = btoa(location.href)
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '')
    const auth = new URL(`/auth/${encoded}`, BASE_URL)

    const nexus = new URL('/auth/google', NEXUS_G)
    nexus.searchParams.set('url', auth.toString())
    location.href = nexus.toString()
  }

  function signout(e: MouseEvent) {
    e.preventDefault()
    const target = new URL('/signout', BASE_URL)
    target.searchParams.set('return', location.href)
    location.href = target.toString()
  }

  onMount(async () => {
    try {
      profile = await getMe()
    } catch {
      profile = null
    }
  })
</script>

<svelte:head>
  <title>{i18n.t('layout.title')}</title>
  <meta name="description" content={i18n.t('layout.description')} />
</svelte:head>

<Toaster position="top-center" />

<nav class="w-full bg-white/50 border-b border-ink-faint/30">
  <div class="h-15 max-w-main mx-auto flex items-center justify-between px-4 md:px-8">
    <div class="flex items-center gap-2.5">
      <img src="/logo.svg" alt="sudoku" class="size-9 bg-gray-50 rounded-md border border-ink-faint/30" />
      <span class="hidden sm:block text-sm font-semibold text-ink-fg">{i18n.t('layout.title')}</span>
    </div>
    <div class="flex items-center gap-1">
      <button onclick={i18n.toggle} aria-label="language" title="语言 / Language"><Languages size={20}/></button>
      {#if profile}
        <div class="flex items-center gap-1.5 pl-1">
          {#if profile.avatar}
            <img src={profile.avatar} alt={profile.name} class="size-8 rounded-full border border-ink-faint/30 object-cover" referrerpolicy="no-referrer" />
          {:else}
            <div class="size-8 rounded-full bg-sky-100 text-sky-700 grid place-items-center text-sm font-semibold">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
          {/if}
          <span class="hidden md:block max-w-28 truncate text-sm text-ink-fg" title={profile.name}>{profile.name}</span>
          <button onclick={signout} aria-label={i18n.t('layout.logout')} title={i18n.t('layout.logout')}>
            <LogOut size={18}/>
          </button>
        </div>
      {:else}
        <button onclick={click} data-id="login" aria-label={i18n.t('layout.login')} title={i18n.t('layout.login')}><User size={20}/></button>
      {/if}
    </div>
  </div>
</nav>

<dialog bind:this={dialog}
  class="m-auto p-4 rounded-md border border-ink-faint/30 shadow-md"
  onclick={click}>
  <a href="{NEXUS_G}/auth/google" onclick={login} aria-label="google"><img src="/img/google.svg" alt="google"/></a>
</dialog>

{@render children()}

<style lang="scss">
  @reference "#tw.css";

  nav button {
    @apply text-ink-fg hover:bg-sky-300 hover:text-white p-2 rounded-full;
  }
</style>
