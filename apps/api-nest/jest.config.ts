import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['json', 'json-summary', 'text'],
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
    // Les tests ciblent les SOURCES des packages workspace (et non leur dist
    // compilé), afin de valider le code réellement modifié.
    '^@forreal/domain$': '<rootDir>/../../../packages/domain/src/index.ts',
    '^@forreal/application$': '<rootDir>/../../../packages/application/src/index.ts',
    '^@forreal/infrastructure-typeorm$':
      '<rootDir>/../../../packages/infrastructure/typeorm/src/index.ts',
    '^@forreal/infrastructure-crypto-bcrypt$':
      '<rootDir>/../../../packages/infrastructure/crypto-bcrypt/src/index.ts',
    '^@forreal/infrastructure-jwt-nest$':
      '<rootDir>/../../../packages/infrastructure/jwt-nest/src/index.ts',
    '^@forreal/infrastructure-uuid-node$':
      '<rootDir>/../../../packages/infrastructure/uuid-node/src/index.ts',
  },
};

export default config;
