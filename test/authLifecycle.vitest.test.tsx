import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuthProvider from "../src/context/AuthProvider";
import { useAuth } from "../src/hooks/useAuth";
import { login } from "../src/services/authService";

const user = { id: "u1", username: "Test", email: "test@example.com", role: "admin" as const };
const token = `test.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.test`;

function SessionProbe() {
  const auth = useAuth();
  return <>
    <span>{auth.loading ? "loading" : auth.user?.username || "logged out"}</span>
    <button onClick={async () => auth.setAuth(await login({ email: user.email, password: "test-password" }))}>Login</button>
    <button onClick={auth.clearAuth}>Logout</button>
  </>;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

test("login stores the session, remount restores it, and logout clears it", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ token, user }));
  vi.stubGlobal("fetch", fetchMock);
  const first = render(<AuthProvider><SessionProbe /></AuthProvider>);
  fireEvent.click(screen.getByText("Login"));
  await screen.findByText("Test");
  expect(localStorage.getItem("token")).toBe(token);
  expect(JSON.parse(localStorage.getItem("user")!)).toEqual(user);
  first.unmount();
  render(<AuthProvider><SessionProbe /></AuthProvider>);
  await screen.findByText("Test");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText("Logout"));
  await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());
  expect(localStorage.getItem("token")).toBeNull();
  expect(localStorage.getItem("user")).toBeNull();
});
