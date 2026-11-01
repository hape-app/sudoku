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
  let profilePinned = $state(false)
  let profileHovered = $state(false)
  let profileRoot = $state<HTMLDivElement>()
  let profileTrigger = $state<HTMLButtonElement>()

  const profileVisible = $derived(profilePinned || profileHovered)

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

  function toggleProfile() {
    profilePinned = !profilePinned
  }

  function profileEnter(e: PointerEvent) {
    if (e.pointerType !== 'touch') profileHovered = true
  }

  function profileLeave(e: PointerEvent) {
    if (e.pointerType !== 'touch') profileHovered = false
  }

  function profileBlur(e: FocusEvent) {
    const next = e.relatedTarget as Node | null
    if (!next || !profileRoot?.contains(next)) profilePinned = false
  }

  function windowClick(e: MouseEvent) {
    if (!profileVisible || profileRoot?.contains(e.target as Node)) return
    profilePinned = false
    profileHovered = false
  }

  function windowKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !profileVisible) return
    profilePinned = false
    profileHovered = false
    profileTrigger?.focus()
  }

  onMount(async () => {
    try {
      profile = await getMe()
    } catch {
      profile = null
    }
  })
</script>

<svelte:window onclick={windowClick} onkeydown={windowKeydown} />

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
        <div
          bind:this={profileRoot}
          class="relative"
          role="group"
          aria-label={profile.name}
          onpointerenter={profileEnter}
          onpointerleave={profileLeave}
          onfocusout={profileBlur}>
          <button
            bind:this={profileTrigger}
            class="profile-trigger"
            data-open={profileVisible}
            onclick={toggleProfile}
            aria-label={profile.name}
            aria-haspopup="menu"
            aria-expanded={profileVisible}
            aria-controls="profile-popover">
            <span class="avatar-fallback relative size-8 overflow-hidden rounded-full border border-ink-faint/30 bg-sky-100 text-sky-700 grid place-items-center text-sm font-semibold">
              {profile.name.slice(0, 1).toUpperCase()}
              {#if profile.avatar}
                <img src={profile.avatar} alt="" class="absolute inset-0 size-full object-cover" referrerpolicy="no-referrer" />
              {/if}
            </span>
          </button>

          <div id="profile-popover" class="profile-popover absolute right-0 top-full z-30 w-48 pt-2" data-open={profileVisible}>
            <div class="overflow-hidden rounded-md border border-ink-faint/30 bg-ink-bg shadow-lg" role="menu" aria-label={profile.name}>
              <div class="border-b border-ink-faint/20 px-3 py-2.5">
                <p class="truncate text-sm font-semibold text-ink-fg">{profile.name}</p>
              </div>
              <div class="p-1.5">
                <button class="profile-logout" onclick={signout} role="menuitem">
                  <LogOut size={16}/>
                  <span>{i18n.t('layout.logout')}</span>
                </button>
              </div>
            </div>
          </div>
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

  nav button.profile-trigger {
    @apply p-0 rounded-full bg-transparent;
  }

  nav button.profile-trigger:hover {
    @apply bg-transparent text-ink-fg;
  }

  .profile-trigger:focus-visible {
    @apply ring-2 ring-sky-300 ring-offset-2 ring-offset-bg;
  }

  .profile-trigger img,
  .profile-trigger .avatar-fallback {
    transition: transform .15s ease, box-shadow .15s ease;
  }

  .profile-trigger[data-open=true] img,
  .profile-trigger[data-open=true] .avatar-fallback {
    transform: scale(1.04);
    box-shadow: 0 1px 4px rgb(27 40 36 / .18);
  }

  .profile-popover {
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-4px);
    transition:
      opacity .15s ease,
      transform .15s ease,
      visibility .15s;
  }

  .profile-popover[data-open=true] {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  nav button.profile-logout {
    @apply flex w-full items-center gap-2 px-2.5 py-2 rounded-sm text-sm text-ink-fg hover:bg-sky-100 hover:text-sky-700;
  }

  @media (prefers-reduced-motion: reduce) {
    .profile-trigger img,
    .profile-trigger .avatar-fallback,
    .profile-popover {
      transition: none;
    }
  }
</style>
