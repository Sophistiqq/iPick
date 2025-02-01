<script lang="ts">
  import Router, { link } from "svelte-spa-router";
  import { App } from "@capacitor/app";
  import Register from "./pages/Register.svelte";
  import Login from "./pages/Login.svelte";
  import { onMount } from "svelte";
  const routes = {
    "/": Login,
    "/register": Register,
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

<Router {routes} />

