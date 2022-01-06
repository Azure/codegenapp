module.exports = {
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    moduleNameMapper: {},
    collectCoverage: true,
    coverageReporters: ['html', ["text", {"skipFull": true}]],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        'dist',
        'src/daoImpl/githubDaoImpl.ts',
        'src/models/ResourceAndOperationModel.ts',
        'src/utils/authUtils.ts'
    ],
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
