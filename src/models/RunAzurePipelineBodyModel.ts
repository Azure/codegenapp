export type RunAzurePipelineBodyModel = {
    resources: {
        repositories: {
            self: {
                refName: string;
            };
        };
    };
    templateParameters: TemplateParameters;
};

export type TemplateParameters = {
    sdkGenerationName: string;
    sdk: string;
    resourceProvider: string;
    readmeFile: string;
    triggerType: string;
    specRepoType: string;
    specRepoUrl: string;
    specRepoBaseBranch: string;
    sdkRepoType: string;
    sdkRepoUrl: string;
    sdkRepoBaseBranch: string;
    skippedTask: string;
    serviceType: string;
};
