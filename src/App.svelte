<script lang="ts">
  import Router, { push } from "svelte-spa-router";
  import { App } from "@capacitor/app";
  import Register from "./pages/Register.svelte";
  import Login from "./pages/Login.svelte";
  import Home from "./pages/Home.svelte";
  import History from "./pages/History.svelte";
  import Wallet from "./pages/Wallet.svelte";
  import Settings from "./pages/Settings.svelte";
  import { onMount } from "svelte";
  import { location } from "svelte-spa-router";
  import { checkAuth, authStore } from "./lib/auth";
  import { Loader } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";

  const routes = {
    "/": Login,
    "/register": Register,
    "/home": Home,
    "/history": History,
    "/wallet": Wallet,
    "/settings": Settings,
  };

  // Subscribe to route changes
  $: {
    const path = $location;
    if ($authStore.isInitialized) {
      if (
        $authStore.isAuthenticated &&
        (path === "/" || path === "/login" || path === "/register")
      ) {
        push("/home");
      } else if (!$authStore.isAuthenticated && path === "/home") {
        push("/");
      }
    }
  }

  onMount(async () => {
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    await checkAuth(true);
  });
</script>

{#if !$authStore.isInitialized}
  <div class="loading-container" transition:fly={{ duration: 1000 }}>
    <Loader size={40} />
  </div>
{:else}
  <Router {routes} />
{/if}

<style>
  .loading-container {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: white;
  }
</style>
