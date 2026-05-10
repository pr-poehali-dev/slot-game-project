import func2url from "../../backend/func2url.json";

const URLS = {
  auth: func2url.auth,
  games: func2url.games,
  user: func2url.user,
  payments: func2url.payments,
  admin: func2url.admin,
};

function getAuthHeaders(): Record<string, string> {
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["X-User-Id"] = userId;
  if (token) headers["X-Auth-Token"] = token;
  return headers;
}

async function request(url: string, path: string, method = "GET", body?: object) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  auth: {
    register: (username: string, password: string) =>
      request(URLS.auth, "/register", "POST", { username, password }),
    login: (username: string, password: string) =>
      request(URLS.auth, "/login", "POST", { username, password }),
    me: () => request(URLS.auth, "/me", "GET"),
  },
  games: {
    play: (data: object) => request(URLS.games, "/", "POST", data),
  },
  user: {
    profile: () => request(URLS.user, "/profile", "GET"),
    history: () => request(URLS.user, "/history", "GET"),
    transactions: () => request(URLS.user, "/transactions", "GET"),
    deposit: (amount: number, method: string, details?: object) =>
      request(URLS.user, "/deposit", "POST", { amount, method, details }),
    withdraw: (amount: number, method: string, details?: object) =>
      request(URLS.user, "/withdraw", "POST", { amount, method, details }),
    createTicket: (subject: string, message: string) =>
      request(URLS.user, "/ticket", "POST", { subject, message }),
    tickets: () => request(URLS.user, "/tickets", "GET"),
  },
  admin: {
    stats: () => request(URLS.admin, "/stats", "GET"),
    users: () => request(URLS.admin, "/users", "GET"),
    transactions: (status?: string) =>
      request(URLS.admin, `/transactions${status ? `?status=${status}` : ""}`, "GET"),
    ban: (user_id: number, banned: boolean) =>
      request(URLS.admin, "/ban", "POST", { user_id, banned }),
    setBalance: (user_id: number, amount: number) =>
      request(URLS.admin, "/balance", "POST", { user_id, amount }),
    approveTx: (tx_id: number, action: "approve" | "reject") =>
      request(URLS.admin, "/approve-tx", "POST", { tx_id, action }),
    tickets: () => request(URLS.admin, "/tickets", "GET"),
    replyTicket: (ticket_id: number, reply: string) =>
      request(URLS.admin, "/reply-ticket", "POST", { ticket_id, reply }),
  },
};
