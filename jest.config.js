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
    testPathIgnorePatterns: ['test/setup', 'test/lib'],
    testRegex: './test/*/.*\\.ts',
    verbose: true,
    rootDir: './',
    setupFilesAfterEnv: ['./jest.setup.js'],
};
