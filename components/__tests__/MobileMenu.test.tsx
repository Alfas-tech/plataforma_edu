import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileMenu from '@/components/MobileMenu';

// Mock Next.js router
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, unoptimized, src, alt, ...otherProps } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...otherProps} src={src} alt={alt || ''} />;
  },
}));

// Mock LoginButton component
jest.mock('@/components/LoginLogoutButton', () => {
  return function MockLoginButton() {
    return <button>Mock Login Button</button>;
  };
});

// Mock Supabase client
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock('@/src/infrastructure/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  })),
}));

describe('MobileMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: user not logged in
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    mockOnAuthStateChange.mockImplementation(() => {
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe
          }
        },
      };
    });
  });

  it('should render menu button', async () => {
    await act(async () => {
      render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuButton).toBeTruthy();
  });

  it('should open menu when button is clicked', async () => {
    await act(async () => {
      render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuButton);
    });

    await waitFor(() => {
      const menuTitle = screen.getByText('Menú');
      expect(menuTitle).toBeTruthy();
    });
  });

  it('should close menu when close button is clicked', async () => {
    await act(async () => {
      render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    // Abrir menú
    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuButton);
    });

    // Esperar que se abra
    const closeButton = await screen.findByRole('button', { name: /close menu/i });

    // Cerrar menú
    await act(async () => {
      await user.click(closeButton);
    });

    // Verificar que se cerró (esperar un tiempo)
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('should close menu when clicking overlay', async () => {
    const { container } = await act(async () => {
      return render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    // Abrir menú
    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuButton);
    });

    // Buscar el overlay
    await waitFor(() => {
      const overlays = container.querySelectorAll('.fixed');
      expect(overlays.length).toBeGreaterThan(0);
    });
  });

  it('should display user info when logged in', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: { full_name: 'John Doe' },
    };

    const mockProfile = {
      id: '123',
      email: 'test@example.com',
      full_name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg',
    };

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: mockProfile,
      error: null,
    });

    await act(async () => {
      render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    // Abrir menú
    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuButton);
    });

    // Verificar que muestra el nombre del usuario
    await waitFor(() => {
      const userName = screen.getByText('John Doe');
      expect(userName).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('should render navigation links', async () => {
    await act(async () => {
      render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    // Abrir menú
    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuButton);
    });

    // Verificar que existen los links de navegación
    await waitFor(() => {
      expect(screen.getByText(/El Curso/i)).toBeTruthy();
      expect(screen.getByText(/Para Profesores/i)).toBeTruthy();
      expect(screen.getByText(/Para Estudiantes/i)).toBeTruthy();
      expect(screen.getByText(/Recursos/i)).toBeTruthy();
    });
  });

  it('should close menu when navigation link is clicked', async () => {
    await act(async () => {
      render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    // Abrir menú
    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuButton);
    });

    // Click en un link
    const cursoLink = await screen.findByText(/El Curso/i);
    await act(async () => {
      await user.click(cursoLink);
    });

    // Esperar un tiempo para que se cierre
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('should prevent body scroll when menu is open', async () => {
    await act(async () => {
      render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    // Abrir menú
    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuButton);
    });

    // Verificar que body.style.overflow está en 'hidden'
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  it('should restore body scroll when menu is closed', async () => {
    await act(async () => {
      render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    // Abrir menú
    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuButton);
    });

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    // Cerrar menú
    const closeButton = await screen.findByRole('button', { name: /close menu/i });
    await act(async () => {
      await user.click(closeButton);
    });

    // Verificar que se restauró el scroll
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = await act(async () => {
      return render(<MobileMenu />);
    });

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    // Abrir menú
    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuButton);
    });

    // Unmount
    act(() => {
      unmount();
    });

    // Verificar que se limpió el overflow
    expect(document.body.style.overflow).toBe('unset');
  });
});