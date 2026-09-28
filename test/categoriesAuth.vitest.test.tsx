import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import CategoriesDropdown from "../src/components/CategoriesDropdown";
import Products from "../src/pages/products/products";
import { apiFetch, apiRequest } from "../src/lib/api";
import { serverUrl } from "../src/utils/constants";

const nativeFetch = vi.fn();
const invalidateSession = vi.hoisted(() => vi.fn());
vi.mock("../src/lib/sessionManager", () => ({ invalidateSession }));

beforeEach(async () => {
  vi.resetModules();
  nativeFetch.mockReset();
  invalidateSession.mockReset();
  vi.stubGlobal("fetch", nativeFetch);
  localStorage.setItem("token", "test-session-token");
  await import("../src/lib/authFetchInterceptor");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("dropdown loads categories with the stored session and emits the category name", async () => {
  nativeFetch.mockResolvedValue(Response.json([{ _id: "c1", name: "Food" }]));
  const onChange = vi.fn();
  render(<CategoriesDropdown selectedCategory="" setSelectedCategory={onChange} />);
  expect(await screen.findByRole("option", { name: "Food" })).toBeInTheDocument();
  expect(nativeFetch).toHaveBeenCalledWith(`${serverUrl}/categories`, expect.objectContaining({
    headers: expect.objectContaining({ Authorization: "Bearer test-session-token" }),
  }));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Food" } });
  expect(onChange).toHaveBeenCalledWith("Food");
});

test("category POST uses the latest stored token and preserves its payload", async () => {
  localStorage.setItem("token", "replacement-test-token");
  nativeFetch.mockResolvedValue(Response.json({ _id: "c1", name: "Food" }, { status: 201 }));
  const body = JSON.stringify({ name: "Food", description: "Groceries" });
  await apiFetch("categories", { method: "POST", body });
  expect(nativeFetch).toHaveBeenCalledWith(`${serverUrl}/categories`, expect.objectContaining({
    method: "POST", body,
    headers: expect.objectContaining({ Authorization: "Bearer replacement-test-token" }),
  }));
});

test("category 401 uses central session invalidation and never retries", async () => {
  nativeFetch.mockResolvedValue(Response.json({ message: "Authentication required" }, { status: 401 }));
  await expect(apiFetch("categories")).rejects.toThrow("Authentication required");
  expect(invalidateSession).toHaveBeenCalledExactlyOnceWith("unauthorized");
  expect(nativeFetch).toHaveBeenCalledTimes(1);
});

test("logged-out requests omit Authorization and do not retry", async () => {
  localStorage.clear();
  nativeFetch.mockResolvedValue(Response.json({ message: "Authentication required" }, { status: 401 }));
  await expect(apiFetch("categories")).rejects.toThrow("Authentication required");
  expect(nativeFetch.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
  expect(nativeFetch).toHaveBeenCalledTimes(1);
  expect(invalidateSession).not.toHaveBeenCalled();
});

test.each(["customers?limit=0&timestamp=1", "customers?limit=1000", "customers/all"])(
  "%s uses the shared authenticated request", async (path) => {
    nativeFetch.mockResolvedValue(Response.json([]));
    await apiRequest(path);
    expect(nativeFetch).toHaveBeenCalledWith(`${serverUrl}/${path}`, expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer test-session-token" }),
    }));
  },
);

test("login 401 remains excluded from session invalidation", async () => {
  nativeFetch.mockResolvedValue(Response.json({ message: "Invalid email or password" }, { status: 401 }));
  const { login } = await import("../src/services/authService");
  await expect(login({ email: "test@example.com", password: "incorrect" })).rejects.toThrow("Invalid email or password");
  expect(invalidateSession).not.toHaveBeenCalled();
  expect(nativeFetch).toHaveBeenCalledTimes(1);
});

test("Products loads categories in add/edit dialogs and preserves product writes", async () => {
  localStorage.setItem("user", JSON.stringify({ role: "admin" }));
  nativeFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-session-token");
    if (url.endsWith("/categories")) return Response.json([{ _id: "c1", name: "Food" }]);
    if (init?.method === "POST" || init?.method === "PUT") {
      return Response.json({ ...JSON.parse(init.body as string), _id: "p1" });
    }
    return Response.json([]);
  });
  render(<Products />);
  fireEvent.click(await screen.findByRole("button", { name: "Nouvel article" }));
  const addDialog = screen.getByRole("dialog");
  await within(addDialog).findByRole("option", { name: "Food" });
  fireEvent.change(within(addDialog).getByLabelText(/Nom de l'Article/), { target: { value: "Rice" } });
  fireEvent.change(within(addDialog).getByRole("combobox", { name: /Filtrer/ }), { target: { value: "Food" } });
  fireEvent.submit(addDialog.querySelector("form")!);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "Modifier Rice" }));
  const editDialog = screen.getByRole("dialog");
  await within(editDialog).findByRole("option", { name: "Food" });
  expect(within(editDialog).getByRole("combobox", { name: /Filtrer/ })).toHaveValue("Food");
  fireEvent.change(within(editDialog).getByLabelText(/Nom de l'Article/), { target: { value: "Brown rice" } });
  fireEvent.submit(editDialog.querySelector("form")!);
  await screen.findByRole("button", { name: "Modifier Brown rice" });
  const writes = nativeFetch.mock.calls.filter(([, init]) => ["POST", "PUT"].includes(init?.method));
  expect(writes.map(([url, init]) => [url, init.method, JSON.parse(init.body).category])).toEqual([
    [`${serverUrl}/products`, "POST", "Food"],
    [`${serverUrl}/products/p1`, "PUT", "Food"],
  ]);
});
