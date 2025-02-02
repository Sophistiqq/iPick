<script lang="ts">
  import { logout } from "../lib/auth";
</script>

<h1>Settings?</h1>

<button on:click={logout}>Logout</button>
