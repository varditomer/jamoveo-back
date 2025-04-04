import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  password: string;
  instrument: string;
  role: string;
  createdAt: Date;
}

export interface UserResponse {
  _id: string;
  username: string;
  instrument: string;
  role: string;
  createdAt: Date;
}

export interface TokenPayload {
  _id: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
}
