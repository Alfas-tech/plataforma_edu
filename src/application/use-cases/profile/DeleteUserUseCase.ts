import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";

/**
 * Result type for delete user operations
 */
export interface DeleteUserResult {
  success: boolean;
  error?: string;
}

/**
 * Delete User Use Case
 *
 * Handles user deletion with proper validation:
 * - Verify current user is admin
 * - Prevent self-deletion
 * - Prevent deleting last admin
 * - Execute atomic delete from both auth and database
 */
export class DeleteUserUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * Execute user deletion
   * @param userId - ID of the user to delete
   * @returns Result with success status and error message if applicable
   */
  async execute(userId: string): Promise<DeleteUserResult> {
    try {
      // Verify current user is authenticated
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: "No authenticated user found",
        };
      }

      // Verify current user is admin
      const currentProfile = await this.profileRepository.getProfileByUserId(
        currentUser.id
      );
      if (!currentProfile || !currentProfile.isAdmin()) {
        return {
          success: false,
          error: "Only administrators can delete users",
        };
      }

      // Prevent self-deletion
      if (currentUser.id === userId) {
        return {
          success: false,
          error: "Cannot delete your own account",
        };
      }

      // Check if user exists
      const userProfile =
        await this.profileRepository.getProfileByUserId(userId);
      if (!userProfile) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // Prevent deleting the last admin
      if (userProfile.isAdmin()) {
        const allProfiles = await this.profileRepository.getAllProfiles();
        const adminCount = allProfiles.filter((p) => p.isAdmin()).length;

        if (adminCount <= 1) {
          return {
            success: false,
            error: "Cannot delete the last administrator",
          };
        }
      }

      // Delete user from both auth and database
      await this.authRepository.deleteUser(userId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error deleting user",
      };
    }
  }
}
