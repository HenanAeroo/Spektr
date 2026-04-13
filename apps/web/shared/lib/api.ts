const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type FetchOptions = RequestInit & {
  token?: string;
};

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}, // Fetch options (method, body...) + Optionnal JWT token
): Promise<T> {
  const { token, ...rest } = options;
  const header = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: { ...header, ...rest.headers },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? "API error");
  } else {
    return res.json();
  }
}
