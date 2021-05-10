module.exports = {
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    moduleNameMapper: {},
    collectCoverage: true,
    coverageReporters: ['html'],
    coveragePathIgnorePatterns: ['/node_modules/', 'dist'],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
    testPathIgnorePatterns: ['test/setup'],
    testRegex: './test/*/.*\\.ts',
    verbose: true,
    rootDir: './',
    setupFilesAfterEnv: ['./jest.setup.js']
};
