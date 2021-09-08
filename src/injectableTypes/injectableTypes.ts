import { AuthUtils } from '../utils/authUtils';

/**
 * The types available for dependency injection.
 */
const InjectableTypes = {
    Config: Symbol.for('Config'),
    Logger: Symbol.for('Logger'),
    CodegenSqlServerConnection: Symbol.for('CodegenSqlServerConnection'),
    DepthCoverageSqlServerConnection: Symbol.for(
        'DepthCoverageSqlServerConnection'
    ),
    MongoDbConnection: Symbol.for('MongoDbConnection'),
    TaskResultDao: Symbol.for('TaskResultDao'),
    PipelineResultCol: Symbol.for('PipelineResultCol'),
    CodeGenerationDao: Symbol.for('CodeGenerationDao'),
    CodeGenerationService: Symbol.for('CodeGenerationService'),
    DepthCoverageDao: Symbol.for('DepthCoverageDao'),
    DepthCoverageService: Symbol.for('DepthCoverageService'),

    GithubDao: Symbol.for('GithubDao'),
    AuthUtils: Symbol.for('AuthUtils'),
};

export { InjectableTypes };
