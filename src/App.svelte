<script lang="ts">
  import Router, { link } from "svelte-spa-router";
  import { App } from "@capacitor/app";
  import Home from "./pages/Home.svelte";
  import About from "./pages/About.svelte";
  import { onMount } from "svelte";
  const routes = {
    "/": Home,
    "/about": About,
  };
  onMount(() => {
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp(); // Exit the app if there's no history
      }
    });
  });
</script>

<nav>
  <a href="/" use:link>Home</a>
  <a href="/about" use:link>About</a>
</nav>

<Router {routes} />
