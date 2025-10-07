# Arquitectura del Proyecto

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura por Capas](#arquitectura-por-capas)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Estándares de Código](#estándares-de-código)
5. [Guías de Desarrollo](#guías-de-desarrollo)
6. [Testing](#testing)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Seguridad](#seguridad)
9. [Performance](#performance)
10. [Responsive Design](#responsive-design)
11. [Styling Guidelines](#styling-guidelines)
12. [Checklist Pre-Commit](#checklist-pre-commit)
13. [Git Workflow](#git-workflow)
14. [Recursos Adicionales](#recursos-adicionales)

---

## Visión General

Este proyecto utiliza una **Arquitectura por Capas Limpia (Clean Architecture)** combinada con **Next.js 14** y el **App Router**. La arquitectura está diseñada para ser:

- ✅ **Mantenible**: Código organizado y fácil de entender
- ✅ **Testeable**: Capas independientes que se pueden probar aisladamente
- ✅ **Escalable**: Fácil agregar nuevas funcionalidades
- ✅ **Tipo-seguro**: TypeScript en todas las capas
- ✅ **Independiente**: La lógica de negocio no depende de frameworks externos

---

## Arquitectura por Capas

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER │
│ (UI Components, Pages, Server Actions) │
│ - app/ (Next.js App Router) │
│ - components/ (React Components) │
│ - src/presentation/actions/ (Server Actions) │
└────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────┐
│ APPLICATION LAYER │
│ (Use Cases - Business Logic) │
│ - src/application/use-cases/ │
└────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE LAYER │
│ (Implementations - Database, APIs, External Services) │
│ - src/infrastructure/repositories/ │
│ - src/infrastructure/supabase/ │
└────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────┐
│ CORE LAYER │
│ (Domain - Entities, Interfaces, Types) │
│ - src/core/entities/ │
│ - src/core/interfaces/ │
│ - src/core/types/ │
└─────────────────────────────────────────────────────────┘

```

### Descripción de Capas

#### 1. **Core Layer (Dominio)**
- **Propósito**: Define las reglas de negocio fundamentales
- **Contiene**:
  - **Entities**: Modelos de dominio (UserEntity, ProfileEntity)
  - **Interfaces**: Contratos que deben cumplir las implementaciones
  - **Types**: Definiciones de tipos compartidos
- **Dependencias**: NINGUNA (capa más independiente)
- **Regla**: No depende de ninguna otra capa

#### 2. **Infrastructure Layer (Infraestructura)**
- **Propósito**: Implementa los detalles técnicos
- **Contiene**:
  - **Repositories**: Implementaciones concretas de interfaces
  - **Supabase**: Configuración y clientes de base de datos
- **Dependencias**: Core Layer
- **Regla**: Implementa las interfaces definidas en Core

#### 3. **Application Layer (Aplicación)**
- **Propósito**: Orquesta la lógica de negocio
- **Contiene**:
  - **Use Cases**: Casos de uso de la aplicación
- **Dependencias**: Core Layer, Infrastructure Layer (a través de interfaces)
- **Regla**: No conoce detalles de UI ni de infraestructura específica

#### 4. **Presentation Layer (Presentación)**
- **Propósito**: Maneja la interacción con el usuario
- **Contiene**:
  - **Components**: Componentes React
  - **Pages**: Rutas de Next.js
  - **Actions**: Server Actions de Next.js
- **Dependencias**: Application Layer, Core Layer
- **Regla**: Solo se comunica con Application a través de Use Cases

---

## Estructura de Carpetas

```

proyecto/
│
├── src/ # Código fuente organizado por capas
│ │
│ ├── core/ # 🔵 CORE LAYER
│ │ ├── entities/ # Entidades del dominio
│ │ │ ├── User.entity.ts
│ │ │ └── Profile.entity.ts
│ │ │
│ │ ├── interfaces/ # Contratos/Interfaces
│ │ │ └── repositories/
│ │ │ ├── IAuthRepository.ts
│ │ │ └── IProfileRepository.ts
│ │ │
│ │ └── types/ # Tipos compartidos
│ │ └── auth.types.ts
│ │
│ ├── infrastructure/ # 🟢 INFRASTRUCTURE LAYER
│ │ ├── repositories/ # Implementaciones de repositorios
│ │ │ ├── SupabaseAuthRepository.ts
│ │ │ └── SupabaseProfileRepository.ts
│ │ │
│ │ └── supabase/ # Cliente de Supabase
│ │ ├── client.ts # Cliente para navegador
│ │ ├── server.ts # Cliente para servidor
│ │ └── middleware.ts # Middleware de sesión
│ │
│ ├── application/ # 🟡 APPLICATION LAYER
│ │ └── use-cases/ # Casos de uso
│ │ └── auth/
│ │ ├── LoginUseCase.ts
│ │ ├── SignUpUseCase.ts
│ │ ├── SignOutUseCase.ts
│ │ ├── SignInWithGoogleUseCase.ts
│ │ ├── ResetPasswordUseCase.ts
│ │ └── UpdatePasswordUseCase.ts
│ │
│ └── presentation/ # 🔴 PRESENTATION LAYER
│ └── actions/ # Server Actions
│ └── auth.actions.ts
│
├── app/ # Next.js App Router
│ ├── (auth)/ # Grupo de rutas de autenticación
│ │ ├── login/
│ │ ├── signup/
│ │ ├── forgot-password/
│ │ └── auth/
│ ├── dashboard/
│ ├── layout.tsx
│ ├── page.tsx
│ └── globals.css
│
├── components/ # Componentes React reutilizables
│ ├── ui/ # Componentes de UI (shadcn/ui)
│ │ ├── button.tsx
│ │ ├── card.tsx
│ │ ├── input.tsx
│ │ └── label.tsx
│ ├── LoginLogoutButton.tsx
│ ├── MobileMenu.tsx
│ └── UserGreetText.tsx
│
├── lib/ # Utilidades
│ └── utils.ts # Funciones auxiliares (cn, etc.)
│
├── public/ # Archivos estáticos
│ └── logo.png
│
├── middleware.ts # Middleware global de Next.js
├── next.config.mjs # Configuración de Next.js
├── tailwind.config.ts # Configuración de Tailwind
├── tsconfig.json # Configuración de TypeScript
└── package.json # Dependencias del proyecto

````

---

## Estándares de Código

### 1. **Idioma**

#### Variables, Funciones y Código
- ✅ **INGLÉS** para todo el código
- ✅ Nombres descriptivos y claros
- ❌ NO usar español en el código

```typescript
// ✅ CORRECTO
const userData = { ... }
function getUserProfile() { ... }
class UserEntity { ... }

// ❌ INCORRECTO
const datosUsuario = { ... }
function obtenerPerfilUsuario() { ... }
class EntidadUsuario { ... }
````

#### Comentarios y Mensajes de Usuario

- ✅ Comentarios en **INGLÉS**
- ✅ Mensajes al usuario en **ESPAÑOL** (interfaz en español)

```typescript
// ✅ CORRECTO
// Fetch user data from database
const message = "Email o contraseña incorrectos"; // UI en español

// ❌ INCORRECTO
// Obtener datos del usuario
const message = "Email or password incorrect"; // UI debe estar en español
```

---

### 2. **Convenciones de Nombres**

#### Variables y Funciones: camelCase

```typescript
// ✅ CORRECTO
const userName = "John";
const isAuthenticated = true;
const userProfileData = { ... };

function getUserById(id: string) { ... }
function validateEmail(email: string) { ... }
```

#### Clases y Tipos: PascalCase

```typescript
// ✅ CORRECTO
class UserEntity { ... }
class SupabaseAuthRepository { ... }
interface IAuthRepository { ... }
type LoginCredentials = { ... }
```

#### Constantes: UPPER_SNAKE_CASE

```typescript
// ✅ CORRECTO
const MAX_LOGIN_ATTEMPTS = 5;
const API_BASE_URL = "https://api.example.com";
const DEFAULT_TIMEOUT = 3000;
```

#### Archivos y Carpetas: kebab-case o PascalCase

```typescript
// ✅ CORRECTO - Componentes
LoginForm.tsx
UserGreetText.tsx
SignInWithGoogleButton.tsx

// ✅ CORRECTO - Utilidades y otros
auth.actions.ts
auth.types.ts
use-auth.ts

// ✅ CORRECTO - Carpetas
use-cases/
forgot-password/
update-password/
```

#### Interfaces y Tipos

```typescript
// ✅ CORRECTO - Interfaces empiezan con 'I'
interface IAuthRepository { ... }
interface IProfileRepository { ... }

// ✅ CORRECTO - Tipos descriptivos
type LoginCredentials = { ... }
type AuthResult = { ... }
type UserData = { ... }

// ❌ INCORRECTO
interface AuthRepository { ... }  // Falta la 'I'
type credentials = { ... }        // No es PascalCase
```

#### Entities (Entidades)

```typescript
// ✅ CORRECTO - Terminan con '.entity.ts'
User.entity.ts → class UserEntity { ... }
Profile.entity.ts → class ProfileEntity { ... }

// ✅ CORRECTO - Nombre de clase termina con 'Entity'
export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string
  ) {}
}
```

---

### 3. **Convenciones de TypeScript**

#### Tipos Explícitos

```typescript
// ✅ CORRECTO - Siempre especificar tipos
function login(credentials: LoginCredentials): Promise<UserEntity> {
  // ...
}

const userName: string = "John";
const age: number = 25;
const isActive: boolean = true;

// ❌ INCORRECTO - Evitar 'any'
function login(credentials: any): any {
  // ...
}
```

#### Interfaces vs Types

```typescript
// ✅ CORRECTO - Usar interfaces para contratos/repositorios
interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<UserEntity>;
}

// ✅ CORRECTO - Usar types para estructuras de datos
type LoginCredentials = {
  email: string;
  password: string;
};

type AuthResult = {
  success: boolean;
  error?: string;
};
```

#### Readonly cuando sea apropiado

```typescript
// ✅ CORRECTO - Propiedades inmutables
class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string
  ) {}
}

// ✅ CORRECTO - Arrays readonly
type Config = {
  readonly allowedDomains: readonly string[];
};
```

#### Null vs Undefined

```typescript
// ✅ CORRECTO - Usar null para "ausencia intencional"
function getUser(id: string): UserEntity | null {
  // Retorna null si no existe
}

// ✅ CORRECTO - Usar undefined para "no inicializado"
type OptionalConfig = {
  timeout?: number; // undefined si no se proporciona
};
```

---

### 4. **Async/Await**

```typescript
// ✅ CORRECTO - Usar async/await
async function login(credentials: LoginCredentials): Promise<UserEntity> {
  try {
    const user = await authRepository.login(credentials);
    return user;
  } catch (error) {
    throw new Error('Login failed');
  }
}

// ❌ INCORRECTO - No usar .then/.catch en código nuevo
function login(credentials: LoginCredentials): Promise<UserEntity> {
  return authRepository.login(credentials)
    .then(user => user)
    .catch(error => throw error);
}
```

---

### 5. **Error Handling**

```typescript
// ✅ CORRECTO - Errores específicos y descriptivos
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

async function login(credentials: LoginCredentials): Promise<UserEntity> {
  try {
    const user = await authRepository.login(credentials);
    return user;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw new Error("Email o contraseña incorrectos");
    }
    throw new Error("Error al iniciar sesión");
  }
}

// ✅ CORRECTO - Siempre capturar errores en Use Cases
export class LoginUseCase {
  async execute(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const user = await this.authRepository.login(credentials);
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
```

---

### 6. **Imports**

```typescript
// ✅ CORRECTO - Orden de imports
// 1. Librerías externas
import { useState } from "react";
import { redirect } from "next/navigation";

// 2. Aliases absolutos (@/)
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { UserEntity } from "@/src/core/entities/User.entity";

// 3. Imports relativos
import { createClient } from "../supabase/server";

// ✅ CORRECTO - Usar aliases absolutos (@/)
import { createClient } from "@/src/infrastructure/supabase/server";

// ❌ INCORRECTO - Evitar imports relativos largos
import { createClient } from "../../../infrastructure/supabase/server";
```

---

### 7. **Comentarios**

```typescript
// ✅ CORRECTO - Comentarios descriptivos en inglés
/**
 * Authenticates a user with email and password
 * @param credentials - User email and password
 * @returns Authenticated user entity
 * @throws Error if credentials are invalid
 */
async function login(credentials: LoginCredentials): Promise<UserEntity> {
  // ...
}

// ✅ CORRECTO - TODOs claros
// TODO: Add rate limiting to prevent brute force attacks
// FIXME: Handle edge case when user email is null

// ❌ INCORRECTO - Comentarios obvios
// This function logs in a user
function login() { ... }

// Set the name
const name = "John";
```

---

### 8. **React/Next.js Específico**

#### Componentes

```typescript
// ✅ CORRECTO - Componentes funcionales con TypeScript
interface LoginFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function LoginForm({ onSuccess, redirectUrl }: LoginFormProps) {
  // ...
}

// ✅ CORRECTO - Usar 'use client' cuando sea necesario
("use client");

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  // ...
}
```

#### Server Actions

```typescript
// ✅ CORRECTO - Siempre usar "use server"
"use server";

import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  // ...
  revalidatePath("/dashboard");
}
```

#### Server Components

```typescript
// ✅ CORRECTO - Async por defecto en Server Components
export default async function DashboardPage() {
  const user = await getCurrentUser();
  return <div>...</div>;
}
```

---

## Guías de Desarrollo

### Cómo Agregar una Nueva Funcionalidad

#### Ejemplo: Agregar "Change Email"

##### 1. **Definir Tipos (Core)**

```typescript
// src/core/types/auth.types.ts
export interface ChangeEmailData {
  newEmail: string;
  password: string;
}
```

##### 2. **Actualizar Interface (Core)**

```typescript
// src/core/interfaces/repositories/IAuthRepository.ts
export interface IAuthRepository {
  // ... existing methods
  changeEmail(data: ChangeEmailData): Promise<void>;
}
```

##### 3. **Implementar en Repository (Infrastructure)**

```typescript
// src/infrastructure/repositories/SupabaseAuthRepository.ts
async changeEmail(data: ChangeEmailData): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    email: data.newEmail
  });
  if (error) throw new Error('Error al cambiar email');
}
```

##### 4. **Crear Use Case (Application)**

```typescript
// src/application/use-cases/auth/ChangeEmailUseCase.ts
export class ChangeEmailUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(data: ChangeEmailData): Promise<AuthResult> {
    try {
      await this.authRepository.changeEmail(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

##### 5. **Agregar Server Action (Presentation)**

```typescript
// src/presentation/actions/auth.actions.ts
export async function changeEmail(formData: FormData) {
  const changeEmailUseCase = new ChangeEmailUseCase(authRepository);
  const newEmail = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await changeEmailUseCase.execute({ newEmail, password });

  if (!result.success) {
    return { error: result.error };
  }

  revalidatePath("/profile");
  return { success: true };
}
```

##### 6. **Crear Componente UI (Presentation)**

```typescript
// app/profile/components/ChangeEmailForm.tsx
"use client";

import { changeEmail } from "@/src/presentation/actions/auth.actions";

export function ChangeEmailForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await changeEmail(formData);
    // Handle result
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## Testing

### Estructura de Tests

```
src/
├── core/
│   └── __tests__/
│       ├── entities/
│       │   └── User.entity.test.ts
│       └── types/
│
├── infrastructure/
│   └── __tests__/
│       └── repositories/
│           └── SupabaseAuthRepository.test.ts
│
└── application/
    └── __tests__/
        └── use-cases/
            └── auth/
                └── LoginUseCase.test.ts
```

### Ejemplo de Test: LoginUseCase

```typescript
// src/application/__tests__/use-cases/auth/LoginUseCase.test.ts
import { LoginUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { UserEntity } from "@/src/core/entities/User.entity";

describe("LoginUseCase", () => {
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    };
    loginUseCase = new LoginUseCase(mockAuthRepository);
  });

  it("should login successfully with valid credentials", async () => {
    const mockUser = new UserEntity("123", "test@example.com");
    mockAuthRepository.login.mockResolvedValue(mockUser);

    const result = await loginUseCase.execute({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
    expect(mockAuthRepository.login).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should return error with invalid credentials", async () => {
    mockAuthRepository.login.mockRejectedValue(
      new Error("Invalid credentials")
    );

    const result = await loginUseCase.execute({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid credentials");
  });
});
```

---

## Mejores Prácticas

### 1. **Single Responsibility Principle (SRP)**

Cada clase/función debe tener una sola responsabilidad

```typescript
// ✅ CORRECTO
class LoginUseCase {
  execute() {
    /* Solo maneja login */
  }
}

class SignUpUseCase {
  execute() {
    /* Solo maneja signup */
  }
}

// ❌ INCORRECTO
class AuthUseCase {
  login() {
    /* ... */
  }
  signUp() {
    /* ... */
  }
  resetPassword() {
    /* ... */
  }
  // Too many responsibilities
}
```

### 2. **Dependency Inversion Principle (DIP)**

Depende de abstracciones, no de concreciones

```typescript
// ✅ CORRECTO - Depende de interface
class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}
}

// ❌ INCORRECTO - Depende de implementación concreta
class LoginUseCase {
  constructor(private authRepository: SupabaseAuthRepository) {}
}
```

### 3. **Open/Closed Principle (OCP)**

Abierto para extensión, cerrado para modificación

```typescript
// ✅ CORRECTO - Fácil agregar nuevos providers
interface IAuthRepository {
  /* ... */
}
class SupabaseAuthRepository implements IAuthRepository {
  /* ... */
}
class FirebaseAuthRepository implements IAuthRepository {
  /* ... */
}

// ❌ INCORRECTO - Modificar código existente
class AuthService {
  login() {
    if (provider === "supabase") {
      /* ... */
    } else if (provider === "firebase") {
      /* ... */
    }
  }
}
```

### 4. **Don't Repeat Yourself (DRY)**

No repitas código

```typescript
// ✅ CORRECTO - Reutilizar lógica
function handleAuthError(error: Error): AuthResult {
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };
}

class LoginUseCase {
  async execute() {
    try {
      /* ... */
    } catch (error) {
      return handleAuthError(error);
    }
  }
}

// ❌ INCORRECTO - Código duplicado
class LoginUseCase {
  async execute() {
    try {
      /* ... */
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

class SignUpUseCase {
  async execute() {
    try {
      /* ... */
    } catch (error) {
      // Same code repeated
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
```

### 5. **Keep It Simple, Stupid (KISS)**

Mantén el código simple

```typescript
// ✅ CORRECTO - Simple y claro
function getDisplayName(user: UserEntity): string {
  return user.fullName || user.email.split("@")[0] || "Usuario";
}

// ❌ INCORRECTO - Demasiado complejo
function getDisplayName(user: UserEntity): string {
  const name = user.fullName
    ? user.fullName.trim()
    : user.email
      ? user.email.includes("@")
        ? user.email.split("@")[0].trim()
        : user.email.trim()
      : "Usuario";
  return name.length > 0 ? name : "Usuario";
}
```

### 6. **You Aren't Gonna Need It (YAGNI)**

No agregues funcionalidad que no necesitas ahora

```typescript
// ✅ CORRECTO - Solo lo necesario
interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<UserEntity>;
  signUp(data: SignUpData): Promise<UserEntity>;
}

// ❌ INCORRECTO - Funcionalidad "por si acaso"
interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<UserEntity>;
  signUp(data: SignUpData): Promise<UserEntity>;
  loginWithFacebook(): Promise<UserEntity>; // No se usa todavía
  loginWithTwitter(): Promise<UserEntity>; // No se usa todavía
  loginWithLinkedIn(): Promise<UserEntity>; // No se usa todavía
}
```

### 7. **Fail Fast**

Valida y falla temprano

```typescript
// ✅ CORRECTO - Validación temprana
async function updatePassword(password: string): Promise<void> {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Continue with logic
  await repository.updatePassword(password);
}

// ❌ INCORRECTO - Validación tardía
async function updatePassword(password: string): Promise<void> {
  const user = await getCurrentUser();
  const hashedPassword = await hashPassword(password);
  const result = await repository.updatePassword(hashedPassword);

  // Too late to validate
  if (!password || password.length < 6) {
    throw new Error("Invalid password");
  }
}
```

### 8. **Immutability**

Prefiere objetos inmutables

```typescript
// ✅ CORRECTO - Inmutable
class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string
  ) {}
}

// ✅ CORRECTO - Crear nuevo objeto en vez de mutar
function updateUser(user: UserEntity, newEmail: string): UserEntity {
  return new UserEntity(user.id, newEmail);
}

// ❌ INCORRECTO - Mutable
class UserEntity {
  id: string;
  email: string;

  setEmail(email: string) {
    this.email = email; // Mutating state
  }
}
```

### 9. **Composition Over Inheritance**

Prefiere composición sobre herencia

```typescript
// ✅ CORRECTO - Composición
class AuthService {
  constructor(
    private authRepository: IAuthRepository,
    private emailService: IEmailService
  ) {}
}

// ❌ INCORRECTO - Herencia excesiva
class BaseService {
  protected repository: any;
}

class AuthService extends BaseService {
  // Tightly coupled to BaseService
}
```

### 10. **Error Handling Consistency**

Manejo de errores consistente en toda la aplicación

```typescript
// ✅ CORRECTO - Patrón consistente
type Result<T> = { success: true; data: T } | { success: false; error: string };

async function login(): Promise<Result<UserEntity>> {
  try {
    const user = await repository.login();
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ❌ INCORRECTO - Inconsistente
async function login(): Promise<UserEntity | null> {
  try {
    return await repository.login();
  } catch (error) {
    console.error(error); // No way to handle error in caller
    return null;
  }
}
```

---

## Seguridad

### 1. **Nunca exponer secretos**

```typescript
// ✅ CORRECTO - Usar variables de entorno
const apiKey = process.env.SUPABASE_ANON_KEY;

// ❌ INCORRECTO - Hard-coded secrets
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### 2. **Validar inputs del usuario**

```typescript
// ✅ CORRECTO
async function updateProfile(formData: FormData) {
  const email = formData.get("email") as string;

  // Validate
  if (!email || !email.includes("@")) {
    return { error: "Invalid email" };
  }

  // Process
  await repository.updateEmail(email);
}
```

### 3. **Sanitizar datos**

```typescript
// ✅ CORRECTO
function sanitizeInput(input: string): string {
  return input.trim().toLowerCase();
}

const email = sanitizeInput(formData.get("email") as string);
```

### 4. **Usar HTTPS en producción**

```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};
```

---

## Performance

### 1. **Server Components por defecto**

```typescript
// ✅ CORRECTO - Server Component (por defecto)
export default async function DashboardPage() {
  const user = await getCurrentUser();
  return <div>{user.name}</div>;
}

// ✅ CORRECTO - Client Component solo cuando sea necesario
"use client";
export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 2. **Lazy Loading de componentes**

```typescript
// ✅ CORRECTO
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

### 3. **Optimización de imágenes**

```typescript
// ✅ CORRECTO
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={100}
  height={100}
  priority // Para imágenes above the fold
/>
```

### 4. **Memoización cuando sea apropiado**

```typescript
// ✅ CORRECTO - Solo cuando haya cálculos costosos
import { useMemo } from 'react';

function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return heavyCalculation(data);
  }, [data]);

  return <div>{processedData}</div>;
}
```

---

## Responsive Design

### Breakpoints estándar

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      sm: "640px", // Mobile landscape
      md: "768px", // Tablet
      lg: "1024px", // Desktop
      xl: "1280px", // Large desktop
      "2xl": "1400px", // Extra large
    },
  },
};
```

### Uso en componentes

```typescript
// ✅ CORRECTO - Mobile first
<div className="text-sm sm:text-base md:text-lg lg:text-xl">
  Responsive text
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

---

## Styling Guidelines

### 1. **Usar Tailwind CSS**

```typescript
// ✅ CORRECTO - Tailwind utility classes
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>

// ❌ INCORRECTO - Inline styles
<button style={{ backgroundColor: 'blue', padding: '8px 16px' }}>
  Click me
</button>
```

### 2. **Componentes reutilizables con shadcn/ui**

```typescript
// ✅ CORRECTO - Usar componentes de shadcn/ui
import { Button } from '@/components/ui/button';

<Button variant="outline" size="lg">
  Click me
</Button>

// Extender cuando sea necesario
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function CustomButton({ className, ...props }) {
  return (
    <Button
      className={cn("my-custom-styles", className)}
      {...props}
    />
  );
}
```

### 3. **Usar cn() para clases condicionales**

```typescript
import { cn } from '@/lib/utils';

function MyComponent({ isActive, className }) {
  return (
    <div
      className={cn(
        "base-classes",
        isActive && "active-classes",
        className
      )}
    >
      Content
    </div>
  );
}
```

---

## Checklist Pre-Commit

Antes de hacer commit, verifica:

- [ ] ✅ Código en inglés (variables, funciones, clases)
- [ ] ✅ Mensajes de usuario en español
- [ ] ✅ Nombres en camelCase, PascalCase según corresponda
- [ ] ✅ Tipos explícitos en TypeScript
- [ ] ✅ No hay `any` sin justificación
- [ ] ✅ Imports ordenados y usando aliases (@/)
- [ ] ✅ Comentarios descriptivos en inglés
- [ ] ✅ Error handling apropiado
- [ ] ✅ No hay console.log() en producción
- [ ] ✅ Tests actualizados (si aplica)
- [ ] ✅ Código formateado (Prettier)
- [ ] ✅ Sin errores de TypeScript: `npx tsc --noEmit`
- [ ] ✅ Sin errores de ESLint: `npm run lint`

---

## Git Workflow

### Mensajes de Commit

Usar formato convencional:

```bash
# Formato: <type>(<scope>): <description>

# Ejemplos:
feat(auth): add password reset functionality
fix(dashboard): resolve user profile loading issue
refactor(repositories): improve error handling
docs(architecture): update coding standards
test(use-cases): add tests for LoginUseCase
chore(deps): update dependencies
```

### Tipos de Commit:

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `refactor`: Refactorización sin cambiar funcionalidad
- `docs`: Documentación
- `test`: Tests
- `chore`: Tareas de mantenimiento
- `style`: Cambios de formato (no afectan código)
- `perf`: Mejoras de performance

---

## Scripts Útiles

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Troubleshooting Común

### Error: "Module not found"

```bash
# Solución: Limpiar cache y reinstalar
rm -rf .next node_modules
npm install
npm run dev
```

### Error: TypeScript no reconoce aliases

```bash
# Solución: Reiniciar TypeScript server en VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Error: "Cannot find module '@/src/...'"

```bash
# Verificar tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Error: Supabase client not working

```bash
# Verificar variables de entorno
# .env.local debe tener:
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Recursos Adicionales

### Documentación Oficial

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Arquitectura y Patrones

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Design Patterns](https://refactoring.guru/design-patterns)

### TypeScript

- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Effective TypeScript](https://effectivetypescript.com/)

**¡Feliz Desarrollo! 🚀**
