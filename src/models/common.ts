export enum REPO {
    SWAGGER_REPO = 'azure-rest-api-specs',
    TF_PROVIDER_REPO = 'terraform-provider-azurerm',
    CLI_REPO = 'azure-cli',
    CLI_EXTENSION_REPO = 'azure-cli-extensions',
    DEPTH_COVERAGE_REPO = 'azure-sdk-pipeline',
}

export enum ORG {
    AZURE = 'Azure',
    MS = 'microsoft',
}

export enum SDK {
    TF_SDK = 'terraform',
    CLI = 'cli',
    CLI_CORE_SDK = 'clicore',
    CLI_EXTENSION_SDK = 'cliextension',
    GO_SDK = 'go',
    DOTNET_SDK = 'dotnet',
    JS_SDK = 'js',
    JAVA_SDK = 'java',
    PYTHON_SDK = 'python',
}

export enum README {
    TF_README_FILE = 'readme.terraform.md',
    CLI_README_FILE = 'readme.az.md',
}

export enum CodeGenerationType {
    DEPTH_COVERAGE = 'depth',
    CI = 'CI',
    ADHOC = 'ad-hoc',
    RELEASE = 'release',
    DEV_ONBOARD = 'dev',
}

export enum RepoType {
    GITHUB = 'github',
    DEVOPS = 'devops',
}

export enum CodeGenerationPipelineTaskName {
    SET_UP = 'Setup',
    GENERATE_CODE = 'GenerateCode',
    BUILD = 'Build',
    MOCK_TEST = 'MockTest',
    LIVE_TEST = 'LiveTest',
}
