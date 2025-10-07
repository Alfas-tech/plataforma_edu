import { LoginCredentials, SignUpData } from "../../types/auth.types";
import { UserEntity } from "../../entities/User.entity";

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<any>;
  signUp(data: SignUpData): Promise<any>;
  signOut(): Promise<any>;
  getCurrentUser(): Promise<any>;
  signInWithGoogle(): Promise<any>;
  resetPassword(email: string): Promise<any>;
  updatePassword(password: string): Promise<any>;
}
