import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginButton from "@/components/LoginLogoutButton";

// Mock Next.js router
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock Supabase client
const mockGetUser = jest.fn();
const mockSignOut = jest.fn();
const mockUnsubscribe = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock("@/src/infrastructure/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  })),
}));

describe("LoginButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockOnAuthStateChange.mockImplementation(() => {
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });
  });

  it("should render login button when user is not logged in", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await act(async () => {
      render(<LoginButton />);
    });

    // Esperar a que termine el estado de carga
    await waitFor(
      () => {
        const loadingText = screen.queryByText(/Cargando/i);
        expect(loadingText).toBeNull();
      },
      { timeout: 1000 }
    );

    // Verificar que hay un botón
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);

    // Verificar que NO hay texto de logout (buscar todos)
    const logoutTexts = screen.queryAllByText(/Cerrar sesión|Salir/i);
    expect(logoutTexts.length).toBe(0);
  });

  it("should render logout button when user is logged in", async () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2024-01-01T00:00:00Z",
    };

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    await act(async () => {
      render(<LoginButton />);
    });

    // Esperar a que termine el estado de carga
    await waitFor(
      () => {
        const loadingText = screen.queryByText(/Cargando/i);
        expect(loadingText).toBeNull();
      },
      { timeout: 1000 }
    );

    // Buscar textos de logout (pueden ser múltiples por responsive design)
    await waitFor(
      () => {
        const logoutTexts = screen.queryAllByText(/Cerrar sesión|Salir/i);
        expect(logoutTexts.length).toBeGreaterThan(0);
      },
      { timeout: 1000 }
    );
  });

  it("should call signOut and redirect when logout button is clicked", async () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2024-01-01T00:00:00Z",
    };

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSignOut.mockResolvedValue({ error: null });

    await act(async () => {
      render(<LoginButton />);
    });

    // Esperar al botón de logout (buscar por role, no por texto)
    let logoutButton: HTMLElement | null = null;
    await waitFor(
      () => {
        const buttons = screen.getAllByRole("button");
        // El botón de logout es el que contiene el icono de LogOut
        logoutButton =
          buttons.find(
            (btn) =>
              btn.textContent?.includes("Cerrar sesión") ||
              btn.textContent?.includes("Salir")
          ) || null;
        expect(logoutButton).not.toBeNull();
      },
      { timeout: 1000 }
    );

    if (!logoutButton) {
      throw new Error("Logout button not found");
    }

    // Click en el botón
    const user = userEvent.setup();
    await act(async () => {
      await user.click(logoutButton!);
    });

    // Verificar que se llamó signOut
    await waitFor(
      () => {
        expect(mockSignOut).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    // Verificar redirección (puede tardar un poco)
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/");
        expect(mockRefresh).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it("should navigate to login when login button is clicked", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await act(async () => {
      render(<LoginButton />);
    });

    // Esperar a que cargue
    await waitFor(
      () => {
        const loadingText = screen.queryByText(/Cargando/i);
        expect(loadingText).toBeNull();
      },
      { timeout: 1000 }
    );

    // Buscar el botón
    const buttons = screen.getAllByRole("button");
    const loginButton = buttons[0];

    // Click en el botón
    const user = userEvent.setup();
    await act(async () => {
      await user.click(loginButton);
    });

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      },
      { timeout: 1000 }
    );
  });

  it("should handle user state changes", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await act(async () => {
      render(<LoginButton />);
    });

    // Verificar que onAuthStateChange fue llamado
    expect(mockOnAuthStateChange).toHaveBeenCalled();
  });

  it("should cleanup subscription on unmount", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    let unmount: () => void;
    await act(async () => {
      const result = render(<LoginButton />);
      unmount = result.unmount;
    });

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    act(() => {
      unmount!();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
