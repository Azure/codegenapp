export enum REPO {
    SWAGGER_REPO = 'azure-rest-api-specs',
    TF_PROVIDER_REPO = 'terraform-provider-azurerm',
    CLI_REPO = 'azure-cli',
    CLI_EXTENSION_REPO = 'azure-cli-extensions',
    DEPTH_COVERAGE_REPO = 'depth-coverage-pipeline',
}

export enum ORG {
    AZURE = 'Azure',
    MS = 'microsoft',
}

export enum SDK {
    TF_SDK = 'terraform',
    CLI = 'cli',
    CLI_CORE_SDK = 'clicore',
    CLI_EXTENSTION_SDK = 'cliextension',
    GO_SDK = 'go',
    DOTNET_SDK = 'dotnet',
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
