/**
 * pipeline meta-data varaibles build in compile.
 */

export interface PipelineVariablesInterface {
    variables: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        CodeGenerationName: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SDK: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SERVICE_TYPE: string;
        stages: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SPEC_REPO_TYPE: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SPEC_REPO_URL: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SPEC_REPO_BASE_BRANCH: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SPEC_REPO_NAME: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SPEC_REPO_OWNER: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SDK_REPO_TYPE: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SDK_REPO_URL: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SDK_REPO_BASE_BRANCH: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SDK_REPO_NAME: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SDK_REPO_OWNER: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        README_FILE_GITHUB_URL_WITH_COMMIT: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        CHECK_OUT: boolean;
    };
}
