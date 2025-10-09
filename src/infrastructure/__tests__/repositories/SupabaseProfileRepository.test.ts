import { SupabaseProfileRepository } from '@/src/infrastructure/repositories/SupabaseProfileRepository';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';

jest.mock('@/src/infrastructure/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/src/infrastructure/supabase/server';

describe('SupabaseProfileRepository', () => {
  let repository: SupabaseProfileRepository;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    repository = new SupabaseProfileRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfileByUserId', () => {
    it('should return profile when found', async () => {
      const mockProfile = {
        id: '123',
        email: 'test@example.com',
        full_name: 'John Doe',
        avatar_url: 'https://avatar.com/avatar.jpg',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await repository.getProfileByUserId('123');

      expect(result).toBeInstanceOf(ProfileEntity);
      expect(result?.id).toBe('123');
      expect(result?.email).toBe('test@example.com');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        'id, email, full_name, avatar_url'
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '123');
    });

    it('should return null when profile not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await repository.getProfileByUserId('123');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockProfile = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Jane Doe',
        avatar_url: 'https://avatar.com/new.jpg',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await repository.updateProfile('123', {
        fullName: 'Jane Doe',
        avatarUrl: 'https://avatar.com/new.jpg',
      });

      expect(result).toBeInstanceOf(ProfileEntity);
      expect(result.fullName).toBe('Jane Doe');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        full_name: 'Jane Doe',
        avatar_url: 'https://avatar.com/new.jpg',
      });
    });

    it('should throw error when update fails', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        repository.updateProfile('123', { fullName: 'Jane Doe' })
      ).rejects.toThrow('Error al actualizar el perfil');
    });
  });
});
