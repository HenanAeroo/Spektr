import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch } from "./api";

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
});
