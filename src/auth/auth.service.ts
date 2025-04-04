import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Logger } from '@nestjs/common';
import {
  User,
  UserResponse,
  TokenPayload,
  LoginResponse,
} from './interfaces/auth.interfaces';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  constructor(private databaseService: DatabaseService) {}

  async login(loginDto: LoginUserDto): Promise<LoginResponse> {
    const { username, password } = loginDto;
    this.logger.debug(`Auth service - login with username: ${username}`);

    // Get user by username
    const usersCollection = await this.databaseService.getCollection('users');
    const user = await usersCollection.findOne<User>({ username });

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error('Invalid username or password');
    }

    // Create a clean user object without password
    const userResponse: UserResponse = {
      _id: user._id?.toString() || '',
      username: user.username,
      instrument: user.instrument,
      role: user.role,
      createdAt: user.createdAt,
    };

    // Generate token
    const token = this.getLoginToken(userResponse);

    return { user: userResponse, token };
  }

  async register(createUserDto: CreateUserDto): Promise<UserResponse> {
    const { username, password, instrument } = createUserDto;
    const saltRounds = 10;

    this.logger.debug(`Auth service - register with username: ${username}`);

    // Validate input
    if (!username || !password || !instrument) {
      throw new Error('Missing required registration information');
    }

    // Check if username exists
    const usersCollection = await this.databaseService.getCollection('users');
    const existingUser = await usersCollection.findOne<User>({ username });

    if (existingUser) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hash = await bcrypt.hash(password, saltRounds);

    // Create user object
    const newUser: User = {
      username,
      password: hash,
      instrument,
      role: 'player',
      createdAt: new Date(),
    };

    // Insert user to DB
    const result = await usersCollection.insertOne(newUser);

    // Create response object
    const userResponse: UserResponse = {
      _id: result.insertedId.toString(),
      username: newUser.username,
      instrument: newUser.instrument,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return userResponse;
  }

  getLoginToken(user: UserResponse): string {
    // Creating a token with user info
    const tokenPayload: TokenPayload = {
      _id: user._id,
      username: user.username,
      role: user.role,
    };

    return jwt.sign(tokenPayload, this.JWT_SECRET, { expiresIn: '1d' });
  }

  validateToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      this.logger.error(`Token validation failed: ${err.message}`);
      return null;
    }
  }
}
