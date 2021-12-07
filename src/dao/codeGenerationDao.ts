import { CodeGeneration } from '../models/entity/CodeGeneration';

export interface CodeGenerationDao {
    getCodeGenerationByName(name: string);
    submitCodeGeneration(codegen: CodeGeneration);
    updateCodeGenerationValuesByName(name: string, values: any);
    deleteCodeGenerationByName(name: string);
    listCodeGenerations(filters: any, filterCompleted?: boolean);
    updateCodeGenerationValueByName(name: string, key: string, value: string);
    listCodeGenerationsByStatus(status: string);
}
