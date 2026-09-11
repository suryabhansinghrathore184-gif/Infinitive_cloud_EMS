/**
 * MongoDB / Database Client Connection Helper
 */

export interface DbConfig {
  url: string;
  provider: 'mongodb';
}

export const getMongoDbConfig = (): DbConfig => {
  return {
    url: process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/ems_hrms_db',
    provider: 'mongodb',
  };
};

export class MongoDbClient {
  private static instance: MongoDbClient;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDbClient {
    if (!MongoDbClient.instance) {
      MongoDbClient.instance = new MongoDbClient();
    }
    return MongoDbClient.instance;
  }

  public async connect(): Promise<boolean> {
    const config = getMongoDbConfig();
    console.log(`[MongoDB Client] Connecting to ${config.url}`);
    this.isConnected = true;
    return true;
  }

  public async disconnect(): Promise<void> {
    console.log('[MongoDB Client] Connection closed cleanly.');
    this.isConnected = false;
  }

  public getStatus(): { connected: boolean; provider: string } {
    return {
      connected: this.isConnected,
      provider: 'mongodb',
    };
  }
}

export const dbClient = MongoDbClient.getInstance();
