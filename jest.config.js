const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // ============================================
  // CONFIGURACIÓN DE COBERTURA CORREGIDA
  // ============================================
  collectCoverageFrom: [
    // SOLO incluir código de src/ que queremos testear
    'src/core/entities/**/*.{ts,tsx}',
    'src/core/types/**/*.{ts,tsx}',
    'src/application/use-cases/**/*.{ts,tsx}',
    'src/infrastructure/repositories/**/*.{ts,tsx}',

    // Incluir componentes específicos (no UI library)
    'components/LoginLogoutButton.tsx',
    'components/MobileMenu.tsx',
    'components/UserGreetText.tsx',

    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/interfaces/**',
    '!components/ui/**',
    '!**/*.config.{js,ts}',
    '!**/node_modules/**',
  ],

  // Thresholds ajustados - solo aplicar a archivos con tests
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 55,
      lines: 55,
      statements: 55,
    },
  },

  // Reportes de cobertura
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Directorios a ignorar en cobertura
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/src/infrastructure/supabase/',
    '/src/presentation/actions/',
    '/components/ui/',
    '/__tests__/',
    '/types/',
    '/interfaces/',
  ],

  // Configuración adicional
  testTimeout: 10000,
  clearMocks: true,
  verbose: true,

  // Ignorar archivos en watch mode
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
  ],
}

module.exports = createJestConfig(customJestConfig)