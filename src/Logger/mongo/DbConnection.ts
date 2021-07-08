import { Db, MongoClient } from "mongodb";

export interface RequiredConfiguration {
  mongoConnectionString: string;
  mongoDbName: string;
}

/**
 * Provides a wrapper for mongodb connections
 */
export class DbConnection {
  public pipelineRunsDb: Promise<Db>;

  constructor(config: RequiredConfiguration) {
    this.pipelineRunsDb = this.getDb(
      config.mongoConnectionString,
      config.mongoDbName
    );
  }

  private async getDb(connectionString: string, dbName: string) {
    const client = await MongoClient.connect(connectionString, {
      native_parser: true,
      useNewUrlParser: true,
    });
    return client.db(dbName);
  }
}
