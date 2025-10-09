import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import UserGreetText from '@/components/UserGreetText';

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
    const { fill, unoptimized, ...otherProps } = props;
    return <img {...otherProps} />;
  },
}));

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

describe('UserGreetText', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
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

  it('should render nothing when user is not logged in', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { container } = await act(async () => {
      return render(<UserGreetText />);
    });

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    // No debería renderizar nada
    expect(container.firstChild).toBeNull();
  });

  it('should render user name when logged in', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: { full_name: 'John Doe' },
    };

    const mockProfile = {
      id: '123',
      email: 'test@example.com',
      full_name: 'John Doe',
      avatar_url: null,
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
      render(<UserGreetText />);
    });

    await waitFor(() => {
      const userName = screen.getByText('John Doe');
      expect(userName).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should display avatar when user has one', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
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
      render(<UserGreetText />);
    });

    await waitFor(() => {
      const avatar = screen.getByAltText(/John Doe/i);
      expect(avatar).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should display initials when no avatar', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    };

    const mockProfile = {
      id: '123',
      email: 'test@example.com',
      full_name: 'John Doe',
      avatar_url: null,
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
      render(<UserGreetText />);
    });

    await waitFor(() => {
      // Buscar la inicial "J" de John
      const initial = screen.getByText('J');
      expect(initial).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should display email username when no full name', async () => {
    const mockUser = {
      id: '123',
      email: 'johndoe@example.com',
    };

    const mockProfile = {
      id: '123',
      email: 'johndoe@example.com',
      full_name: null,
      avatar_url: null,
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
      render(<UserGreetText />);
    });

    await waitFor(() => {
      const userName = screen.getByText('johndoe');
      expect(userName).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle auth state changes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await act(async () => {
      render(<UserGreetText />);
    });

    // Verificar que se registró el listener
    expect(mockOnAuthStateChange).toHaveBeenCalled();
  });

  it('should cleanup subscription on unmount', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { unmount } = render(<UserGreetText />);

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    act(() => {
      unmount();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle profile fetch errors gracefully', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    };

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Profile not found' },
    });

    await act(async () => {
      render(<UserGreetText />);
    });

    // Debería mostrar el email como fallback
    await waitFor(() => {
      const fallback = screen.getByText('test');
      expect(fallback).toBeTruthy();
    }, { timeout: 1000 });
  });
});