#!/usr/bin/env node
import {
    MessageRecord,
    PipelineResult,
    PipelineStatus,
    RawMessageRecord,
} from '@azure/swagger-validation-common';

import { CodeGenerationPipelineTaskName } from '../models/common';
import {
    CodegenCodeGenerateTaskResult,
    CodegenPipelineTaskResult,
    TestTaskResult,
} from '../models/entity/taskResultMongodb/entity/TaskResult';

export function formatCodeUrl(
    codegenName: string,
    pipelineBuildID: string
): string {
    return (
        'https://depthcoverage.blob.core.windows.net/depthcoverage/' +
        codegenName +
        '-' +
        pipelineBuildID +
        '-generated.tar.gz'
    );
}

export function generateCodeGeneratePipelineTaskResult(
    codegenName: string,
    pipelineBuildId: string,
    task: string,
    status: string,
    pipelineResult: string,
    logfile: string
): CodegenPipelineTaskResult {
    let errorNum: number = 0;
    let warnNum: number = 0;
    let codeCoverage: number = 0;
    let messages: MessageRecord[] = [];
    const fs = require('fs');
    if (fs.existsSync(logfile)) {
        let lines = require('fs')
            .readFileSync(logfile, 'utf-8')
            .split('\n')
            .filter(Boolean);
        lines.forEach((line) => {
            console.log(line);
            if (
                line.toLowerCase().indexOf('error') !== -1 ||
                line.toLowerCase().indexOf('fail') !== -1 ||
                line.toLowerCase().indexOf('fatal') !== -1
            ) {
                errorNum++;
                let message: RawMessageRecord = {
                    level: 'Error',
                    message: line,
                    time: new Date(),
                    type: 'Raw',
                };
                messages.push(message);
            } else if (line.toLowerCase().indexOf('warning') !== -1) {
                warnNum++;
            } else if (line.toLowerCase().indexOf('exception') !== -1) {
                errorNum++;
                let message: RawMessageRecord = {
                    level: 'Error',
                    message: line,
                    time: new Date(),
                    type: 'Raw',
                };
                messages.push(message);
            } else if (line.toLowerCase().indexOf('coverage:') !== -1) {
                let coverage: string = line.replace('coverage:', '').trim();
                codeCoverage = parseFloat(coverage) / 100;
            }
        });
    } else {
        console.log('logfile ' + logfile + ' does not exist.');
    }

    let result: CodegenPipelineTaskResult = {
        name: task,
        pipelineId: pipelineBuildId,
        status: status as PipelineStatus,
        result: pipelineResult as PipelineResult,
        errorCount: errorNum,
        warningCount: warnNum,
        checkRunId: 0,
        checkRunUrl: '',
        queuedAt: new Date(),
        messages: messages,
    };

    if (task === CodeGenerationPipelineTaskName.GENERATE_CODE) {
        (result as CodegenCodeGenerateTaskResult).codeUrl = formatCodeUrl(
            codegenName,
            pipelineBuildId
        );
    }
    if (
        task === CodeGenerationPipelineTaskName.MOCK_TEST ||
        task === CodeGenerationPipelineTaskName.LIVE_TEST
    ) {
        (result as TestTaskResult).codeCoverage = codeCoverage;
    }
    return result;
}

export function generateCodeGeneratePipelineTaskResultFile(
    codegenname: string,
    pipelineBuildId: string,
    task: string,
    status: string,
    pipelineresult: string,
    logfile: string,
    pipelineResultLog: string
): CodegenPipelineTaskResult {
    const result: CodegenPipelineTaskResult =
        generateCodeGeneratePipelineTaskResult(
            codegenname,
            pipelineBuildId,
            task,
            status,
            pipelineresult,
            logfile
        );

    if (pipelineResultLog !== undefined) {
        const fs = require('fs');
        fs.writeFileSync(pipelineResultLog, JSON.stringify(result, null, 2));
    }

    return result;
}

const main = () => {
    const args = parseArgs(process.argv);
    const codegenname = args['codegen'];
    const pipeline_buildId = args['pipelineBuildId'];
    const task = args['task'];
    const status = args['status'];
    const pipelineresult = args['result'];
    const logfile = args['logfile'];
    const pipeline_log = args['pipelineLog'];

    return generateCodeGeneratePipelineTaskResultFile(
        codegenname,
        pipeline_buildId,
        task,
        status,
        pipelineresult,
        logfile,
        pipeline_log
    );
};

/**
 * Parse a list of command line arguments.
 * @param argv List of cli args(process.argv)
 */
const FLAG_REGEX = /^--([^=:]+)([=:](.+))?$/;
export const parseArgs = (argv: string[]) => {
    const result: any = {};
    for (const arg of argv) {
        const match = FLAG_REGEX.exec(arg);
        if (match) {
            const key = match[1];
            const rawValue = match[3];
            result[key] = rawValue;
        }
    }
    return result;
};

main();
