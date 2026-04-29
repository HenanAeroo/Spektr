export function loginWithGoogle() {
  window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/auth/google`;
}
