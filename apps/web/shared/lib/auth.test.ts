import { describe, beforeEach, it, expect } from "vitest";
import { getToken, setToken, removeToken, getUser } from "./auth";

describe("auth token store", () => {
  beforeEach(() => {
    removeToken();
  });

  const fakeToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJUZXN0In0.0_FK1b9UWhoiNiDr3ppv_hjjVm0bk2VFwMfwltSda0g";

  it("token undefined", () => {
    expect(getToken()).toBe(null);
  });

  it("retourne le token après setToken", () => {
    setToken("mon-token");
    expect(getToken()).toBe("mon-token");
  });

  it("défini le token puis le supprime", () => {
    setToken("mon-token");
    removeToken();
    expect(getToken()).toBe(null);
  });

  it("mauvais token user", () => {
    expect(getUser()).toBe(null);
  });

  it("vérifie l'utilisateur et le token", () => {
    setToken(fakeToken);
    expect(getUser()?.email).toBe("test@test.com");
  });
});
