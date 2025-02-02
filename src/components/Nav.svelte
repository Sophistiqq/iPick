<script lang="ts">
  import { link } from "svelte-spa-router";
  import { Home, Calendar, Wallet, Settings } from "lucide-svelte";
</script>

<nav>
  <a href="/" use:link>
    <Home size="24" />
    <p>Home</p>
  </a>
  <a href="/history" use:link>
    <Calendar size="24" />
    <p>History</p>
  </a>
  <a href="/wallet" use:link>
    <Wallet size="24" />
    <p>Wallet</p>
  </a>
  <a href="/settings" use:link>
    <Settings size="24" />
    <p>Settings</p>
  </a>
</nav>

<style>
  nav {
    display: flex;
    justify-content: space-around;
    padding: 0.75rem;
    background-color: #f0f0f0;
    flex: 1;
    border-top: 1px solid #ddd;
    z-index: 100;
  }

  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    color: #333;
    font-size: 0.8rem;
  }
</style>
