const API_BASE = import.meta.env.VITE_API_URL || '';

interface Credentials {
  username: string;
  password: string;
}

export async function register(creds: Credentials) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function login(creds: Credentials) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchProfile(username: string) {
  const res = await fetch(`${API_BASE}/profile/${username}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateProfile(username: string, data: any) {
  const res = await fetch(`${API_BASE}/profile/${username}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function battle() {
  const res = await fetch(`${API_BASE}/battle`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
