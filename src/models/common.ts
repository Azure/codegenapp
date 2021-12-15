export enum Repo {
    SwaggerRepo = 'azure-rest-api-specs',
    TfProviderRepo = 'terraform-provider-azurerm',
    CliRepo = 'azure-cli',
    CliExtensionRepo = 'azure-cli-extensions',
    DepthCoverageRepo = 'azure-sdk-pipeline',
}

export enum Org {
    Azure = 'Azure',
    Ms = 'microsoft',
}

export enum Sdk {
    TfSdk = 'terraform',
    CLI = 'cli',
    CliCoreSdk = 'clicore',
    CliExtensionSdk = 'cliextension',
    GoSdk = 'go',
    DotNetSdk = 'net',
    JsSdk = 'js',
    JavaSdk = 'java',
    PythonSdk = 'python',
}

export enum README {
    TfReadmeFile = 'readme.terraform.md',
    CliReadmeFile = 'readme.az.md',
}

export enum CodeGenerationType {
    DepthCoverage = 'depth',
    Ci = 'Ci',
    Adhoc = 'ad-hoc',
    Release = 'release',
    DevOnboard = 'dev',
}

export enum RepoType {
    GITHUB = 'github',
    DEVOPS = 'devops',
}

export enum CodeGenerationPipelineTaskName {
    Setup = 'Setup',
    GenerateCode = 'GenerateCode',
    Build = 'Build',
    MockTest = 'MockTest',
    LiveTest = 'LiveTest',
}
