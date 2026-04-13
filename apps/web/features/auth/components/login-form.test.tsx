import { render, screen } from "@testing-library/react";
import LoginForm from "./login-form";
import { describe, it, vi, expect } from "vitest";
import userEvent from "@testing-library/user-event";

const handleLogin = vi.fn();
const loginWithGoogle = vi.fn();

vi.mock("../hooks/use-auth", () => ({
  useAuth: () => ({
    handleLogin,
    loginWithGoogle,
    isLoading: false,
    error: null,
  }),
}));

describe("login-form", () => {
  it("affiche le formulaire", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("button", { name: "Se connecter" }),
    ).toBeInTheDocument();
  });

  it("connexion avec click sur handleLogin", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "test@test.com",
    );
    await user.type(
      document.querySelector('input[type="password"]'),
      "123@test",
    );
    await user.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(handleLogin).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "123@test",
    });
  });
});
