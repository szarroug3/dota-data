module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: [
    '<rootDir>/jest.upstash-mock.js',
    '<rootDir>/jest.setup.js'
  ],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json'
      }
    ]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@upstash/redis|uncrypto)/)'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  verbose: false,
  silent: true,
  projects: [
    {
      displayName: 'backend',
      testMatch: [
        '<rootDir>/src/tests/lib/**/*.test.ts',
        '<rootDir>/src/tests/app/api/**/*.test.ts'
      ],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            useESM: true,
            tsconfig: '<rootDir>/tsconfig.jest.json'
          }
        ]
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@upstash/redis|uncrypto)/)'
      ],
      extensionsToTreatAsEsm: [
        '.ts',
        '.tsx'
      ]
    },
    {
      displayName: 'frontend',
      testMatch: [
        '<rootDir>/src/tests/contexts/**/*.test.ts',
        '<rootDir>/src/tests/contexts/**/*.test.tsx',
        '<rootDir>/src/tests/components/**/*.test.ts',
        '<rootDir>/src/tests/components/**/*.test.tsx',
        '<rootDir>/src/tests/hooks/**/*.test.ts',
        '<rootDir>/src/tests/hooks/**/*.test.tsx',
        '<rootDir>/src/tests/app/**/*.test.ts',
        '<rootDir>/src/tests/app/**/*.test.tsx'
      ],
      testPathIgnorePatterns: [
        '.*/api/.*'
      ],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.jest.json'
          }
        ]
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@upstash/redis|uncrypto|cheerio|domhandler|react-resizable-panels)/)'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js'
      ]
    }
  ]
}; 