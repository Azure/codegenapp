import { inject, injectable } from 'inversify';
import { Connection } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';

import { CodeGenerationDao } from '../dao/codeGenerationDao';
import { InjectableTypes } from '../injectableTypes/injectableTypes';
import { CodeGeneration } from '../models/entity/CodeGeneration';

@injectable()
export class CodeGenerationDaoImpl implements CodeGenerationDao {
    @inject(InjectableTypes.Logger) private logger;
    private repo: Repository<CodeGeneration>;

    constructor(
        @inject(InjectableTypes.MongoDbConnection)
        connection: Connection
    ) {
        this.repo = connection.getRepository(CodeGeneration);
    }

    public async getCodeGenerationByName(
        name: string
    ): Promise<CodeGeneration> {
        const codegen = await this.repo.findOne({ name: name });
        return codegen;
    }

    public async submitCodeGeneration(codegen: CodeGeneration): Promise<void> {
        await this.repo.save(codegen);
    }

    /* update code-gen information. */
    public async updateCodeGenerationValuesByName(
        name: string,
        values: any
    ): Promise<any> {
        const codegen = await this.repo.findOne({ name: name });
        for (const key of Object.keys(values)) {
            codegen[key] = values[key];
        }
        await this.repo.save(codegen);
    }

    public async deleteCodeGenerationByName(name: string): Promise<any> {
        const codegen = await this.repo.findOne({ name: name });
        await this.repo.delete(codegen);
    }

    /*Get all code generations of an special onboard type. */
    public async listCodeGenerations(
        filters: {} = undefined,
        filterCompleted: boolean = false
    ): Promise<CodeGeneration[]> {
        if (!filters) filters = {};
        if (filterCompleted) {
            filters['status'] =
                'Not(Equal(completed) OR Equal(pipelineCompleted))';
        }
        const codegens = await this.repo.find(filters);
        return codegens;
    }

    /* update code-gen information. */
    public async updateCodeGenerationValueByName(
        name: string,
        key: string,
        value: string
    ): Promise<any> {
        let codegen = await this.repo.findOne({ name: name });
        codegen[key] = value;
        await this.repo.save(codegen);
    }

    public async listCodeGenerationsByStatus(
        status: string
    ): Promise<CodeGeneration[]> {
        const codegens = await this.repo.find({ status: status });
        return codegens;
    }
}
