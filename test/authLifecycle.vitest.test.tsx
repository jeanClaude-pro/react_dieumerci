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
    <button onClick={() => void auth.logout()}>Logout</button>
  </>;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

test("login stores only the token; reopening asks the server; logout ends the session on the server", async () => {
  const calls: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url.replace(/^.*\/api/, ""));
    if (url.endsWith("/auth/login")) return Response.json({ token, user });
    if (url.endsWith("/auth/session")) return Response.json({ user });
    if (url.endsWith("/auth/logout")) return Response.json({ success: true });
    return new Response("{}", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  const location = { href: "/" } as Location;
  vi.stubGlobal("location", location);

  const first = render(<AuthProvider><SessionProbe /></AuthProvider>);
  fireEvent.click(screen.getByText("Login"));
  await screen.findByText("Test");
  expect(localStorage.getItem("token")).toBe(token);
  // The user (and its role) is never written to the browser.
  expect(localStorage.getItem("user")).toBeNull();
  first.unmount();

  // A forged role in storage is ignored: the server's answer wins.
  localStorage.setItem("user", JSON.stringify({ ...user, username: "Forged", role: "admin" }));
  render(<AuthProvider><SessionProbe /></AuthProvider>);
  await screen.findByText("Test");
  expect(calls).toContain("/auth/session");
  expect(localStorage.getItem("user")).toBeNull();

  fireEvent.click(screen.getByText("Logout"));
  await waitFor(() => expect(calls).toContain("/auth/logout"));
  await waitFor(() => expect(localStorage.getItem("token")).toBeNull());
});

test("an unanswered session check never opens the app", async () => {
  localStorage.setItem("token", token);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  render(<AuthProvider><SessionProbe /></AuthProvider>);
  await screen.findByRole("alert");
  expect(screen.queryByText("Test")).toBeNull();
});
