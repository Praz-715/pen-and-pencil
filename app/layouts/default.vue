<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />

    <MobileMenu />
    <SearchOverlay />
    <WhatsAppFab />
  </div>
</template>
