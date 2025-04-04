// src/database/database.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MongoClient, Collection, Db, Document } from 'mongodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private db: Db | null = null;
  private client: MongoClient | null = null;

  constructor(private configService: ConfigService) {}

  async getCollection<T extends Document = any>(
    collectionName: string,
  ): Promise<Collection<T>> {
    try {
      const db = await this.connect();
      return db.collection<T>(collectionName);
    } catch (error) {
      this.logger.error(`Failed to get collection ${collectionName}`, error);
      throw error;
    }
  }

  private async connect(): Promise<Db> {
    if (this.db) return this.db;

    try {
      const dbUrl = this.configService.get<string>('MONGODB_URI');
      const dbName = this.configService.get<string>('DB_NAME');

      if (!dbUrl) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      this.logger.log(`Connecting to MongoDB Atlas (database: ${dbName})`);
      this.client = await MongoClient.connect(dbUrl);
      this.db = this.client.db(dbName);
      this.logger.log('Connected to MongoDB Atlas successfully');
      return this.db;
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  async onApplicationShutdown() {
    if (this.client) {
      await this.client.close();
      this.logger.log('Disconnected from MongoDB');
    }
  }
}
