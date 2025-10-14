import { LoginCredentials, SignUpData } from "../../types/auth.types";
import { UserEntity } from "../../entities/User.entity";

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<UserEntity>;
  signUp(data: SignUpData): Promise<{ user: UserEntity; needsConfirmation: boolean }>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<UserEntity | null>;
  signInWithGoogle(): Promise<string>;
  resetPassword(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
}
