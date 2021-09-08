import { Column, Entity, ObjectIdColumn } from 'typeorm';
import {
    MessageRecord,
    PipelineResult,
    PipelineStatus,
} from '@azure/swagger-validation-common';

@Entity('sdkGenerationResults')
export class TaskResult {
    @ObjectIdColumn()
    id: string;
    @Column()
    key: string;
    @Column()
    pipelineBuildId: string;
    @Column()
    taskResult: CodegenPipelineTaskResult;
}

export type CodegenPipelineTaskResultCommon = {
    name: string;
    pipelineId: string;
    subTaskKey?: string;
    env?: string;
    suppressed?: boolean;
    subTitle?: string;
    parentName?: string;
    status?: PipelineStatus;
    result?: PipelineResult;
    errorCount?: number;
    warningCount?: number;
    checkRunId: number;
    checkRunUrl: string;
    checkState?: string;
    azurePipelineUrl?: string;
    pipelineJobId?: string;
    pipelineTaskId?: string;
    queuedAt: Date;
    inProgressAt?: Date;
    completedAt?: Date;
    labels?: string[];
    logUrl?: string;
    messages?: MessageRecord[];
};

export type CodegenCodeGenerateTaskResult = CodegenPipelineTaskResultCommon & {
    codeUrl?: string;
};

export type TestTaskResult = CodegenPipelineTaskResultCommon & {
    apiCoverage?: number;
    codeCoverage?: number;
};

export type CodegenPipelineTaskResult =
    | CodegenPipelineTaskResultCommon
    | CodegenCodeGenerateTaskResult
    | TestTaskResult;
