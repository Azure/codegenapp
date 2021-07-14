import {
  MessageRecord,
  PipelineResult,
  PipelineStatus,
} from "@azure/swagger-validation-common";

export type TaskState = "enabled" | "disabled";

export type ResultGroup = {
  name: string;
  title: string;
  order?: number;
};

export type ResultGroupConfig = {
  groups: ResultGroup[];
  required: string[];
};

export type Filter = {
  include?: string[];
  exclude?: string[];
};

export type TaskConfig = {
  name: string;
  subTaskKey?: string;
  commentShowName: string;
  commentGroupName: string;
  checkShowName: string;
  state: TaskState;
  suppressionLabel?: string;
  labelsOnTaskFailure?: string[];
  passNote: string;
  resultGroups?: ResultGroupConfig;
  branchFilter?: Filter;
  autoLabelingBranchFilter?: Filter;
  autoLabelingDisableRemoveFor?: string[];
  baseBranchFilter?: Filter;
  triggerType?: ["CI"] | ["PR"] | ["CI", "PR"];
  env: string | string[];
  isParent?: boolean;
  skipRenderStatistics?: boolean;
  subTaskOverriding?: { [name: string]: Partial<TaskConfig> };
};

export type PipelineTaskInfoMap = {
  [taskKey: string]: PipelineTaskInfo;
};

export type PipelineTaskInfo = {
  config: TaskConfig;
};

export type PipelineBuildCommon = {
  pipelineBuildId: string;
  tasks: PipelineTaskInfoMap;
};
export type CodegenPipelineBuild = PipelineBuildCommon & {
  stages: string[];
};

export type CodegenPipelineTask = {
  key: string; // {codegenname/piplelineBuildId/taskName}
  name: string;
  subTaskKey?: string;
  env?: string;
  codegenName: string;
  pipelineBuildId: string;
  taskResult: CodegenPipelineTaskResult;
};

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
  logurl?: string;
  messages?: MessageRecord[];
};

export type CodegenCodeGenerateTaskResult = CodegenPipelineTaskResultCommon & {
  codeUrl?: string;
}

export type CodegenPipelineTaskResult = CodegenPipelineTaskResultCommon | CodegenCodeGenerateTaskResult;