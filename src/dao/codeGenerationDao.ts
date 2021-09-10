import { CodeGeneration } from '../models/entity/codegenSqlServer/entity/CodeGeneration';

export interface CodeGenerationDao {
    getCodeGenerationByName(name: string);
    submitCodeGeneration(codegen: CodeGeneration);
    updateCodeGenerationValuesByName(name: string, values: any);
    deleteCodeGenerationByName(name: string);
    listCodeGenerations(filters: {}, filterCompleted: boolean);
    updateCodeGenerationValueByName(name: string, key: string, value: string);
    listCodeGenerationsByStatus(status: string);
}
