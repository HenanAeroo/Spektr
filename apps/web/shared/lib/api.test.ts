import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch } from "./api";

vi.mock("@/features/auth/actions/refresh", () => ({
  refresh: vi.fn().mockResolvedValue(undefined),
}));

describe("apiFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks(); // reset fetch
  });

  it("retourne les données en cas de succès", async () => {
    // mock fetch to return { id: 1 }
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      }),
    );

    // call apiFetch and verify the result
    const data = await apiFetch("/test");
    expect(data).toEqual({ id: 1 });
  });

  it("mauvaises données", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: "Not found" }),
      }),
    );

    await expect(apiFetch("/test")).rejects.toThrow("Not found");
  });

  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ id: 1 }),
  });

  it("envoie le header Authorization avec le token", async () => {
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/test", { token: "mon-token" });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer mon-token",
    );
  });

  it("renvoie undefined sur une réponse 204 sans corps", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error("no body")),
      }),
    );

    await expect(apiFetch("/test")).resolves.toBeUndefined();
  });

  it("rafraîchit puis rejoue la requête sur un 401", async () => {
    const fetch401ThenOk = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 7 }),
      });
    vi.stubGlobal("fetch", fetch401ThenOk);

    const data = await apiFetch("/test");

    expect(fetch401ThenOk).toHaveBeenCalledTimes(2);
    expect(data).toEqual({ id: 7 });
  });
});
