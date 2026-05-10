export interface User {
  user_id: number;
  username: string;
  balance: number;
  is_admin: boolean;
}

export function saveAuth(data: { token: string; user_id: number; username: string; balance: number; is_admin: boolean }) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user_id", String(data.user_id));
  localStorage.setItem("user", JSON.stringify({ user_id: data.user_id, username: data.username, balance: data.balance, is_admin: data.is_admin }));
}

export function getUser(): User | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function updateBalance(balance: number) {
  const user = getUser();
  if (user) {
    user.balance = balance;
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user");
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem("token");
}
