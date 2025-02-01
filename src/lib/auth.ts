// auth.ts
import { push } from "svelte-spa-router";
import { writable } from "svelte/store";

type User = {
  id: string;
  email: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
};

const serverUrl = "http://10.0.23.245:3000";
const tokenKey = "auth_token";

// Single auth store
export const authStore = writable<AuthState>({
  user: null,
  isAuthenticated: false,
  isInitialized: false
});

// Enhanced token management
const TokenManager = {
  set(token: string) {
    localStorage.setItem(tokenKey, token);
  },
  get(): string | null {
    return localStorage.getItem(tokenKey);
  },
  remove() {
    localStorage.removeItem(tokenKey);
  }
};

// Update checkAuth function to properly handle initialization
export async function checkAuth(shouldRedirect = true): Promise<boolean> {
  const token = TokenManager.get();
  
  if (!token) {
    authStore.set({
      user: null,
      isAuthenticated: false,
      isInitialized: true
    });
    if (shouldRedirect) {
      push('/');
    }
    return false;
  }

  try {
    const response = await fetch(`${serverUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      authStore.set({
        user: data.user,
        isAuthenticated: true,
        isInitialized: true
      });
      if (shouldRedirect && window.location.href !== '#/home') {
        push('/home');
      }
      return true;
    } else {
      throw new Error('Invalid token');
    }
  } catch (error) {
    TokenManager.remove();
    authStore.set({
      user: null,
      isAuthenticated: false,
      isInitialized: true
    });
    if (shouldRedirect) {
      push('/');
    }
    return false;
  }
}

// Update login function
export async function login(username: string, password: string): Promise<User | null> {
  try {
    const response = await fetch(`${serverUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.status === "success") {
      TokenManager.set(data.token);
      authStore.set({
        user: data.user,
        isAuthenticated: true,
        isInitialized: true
      });
      push('/home');
      return data.user;
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Update logout function
export async function logout(): Promise<void> {
  try {
    await apiClient.fetch('/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    TokenManager.remove();
    authStore.set({
      user: null,
      isAuthenticated: false,
      isInitialized: true
    });
    push('/');
  }
}

export async function register(username: string, password: string): Promise<User | null> {
  try {
    const response = await fetch(`${serverUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.status === "success") {
      TokenManager.set(data.token);
      authStore.set({
        user: data.user,
        isAuthenticated: true,
        isInitialized: true
      });
      push('/home');
      return data.user;
    } else {
      throw new Error(data.error || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

// Navigation guard helper
export function requireAuth(onFailure: () => void = () => window.location.href = '/#/login'): void {
  if (!TokenManager.get()) {
    onFailure();
  }
}
// Add route guards
export function guardAuthenticatedRoute(path: string): void {
  const token = localStorage.getItem('auth_token');
  if (!token && path !== '/login' && path !== '/register') {
    push('/login');
  }
}

export function guardPublicRoute(path: string): void {
  const token = localStorage.getItem('auth_token');
  if (token && (path === '/login' || path === '/register' || path === '/')) {
    push('/home');
  }
}


