import { Injectable } from '@nestjs/common';
import { MongoClient, Collection, Db } from 'mongodb';

@Injectable()
export class DatabaseService {
  private client: MongoClient;
  private db: Db;
  private readonly dbURL = 'mongodb://localhost:27017';
  private readonly dbName = 'jamoveo';

  constructor() {
    // Remove the deprecated options
    this.client = new MongoClient(this.dbURL);
    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Cannot connect to MongoDB', error);
      throw error;
    }
  }

  async getCollection(collectionName: string): Promise<Collection> {
    if (!this.db) {
      await this.connect();
    }
    return this.db.collection(collectionName);
  }
}
