// src/rehearsals/rehearsals.gateway.ts
// In NestJS, Gateways are a specific abstraction for handling WebSocket connections. They're similar to Controllers,
// but for WebSockets instead of HTTP requests.
// The relationship is:
//---Controllers handle HTTP requests (REST API)
//---Gateways handle WebSocket connections (real-time communication)
//---Services contain business logic used by both

// A Gateway is the NestJS way of organizing WebSocket logic. It:
//---Handles connection/disconnection events
//---Defines message handlers
//---Manages rooms and namespaces
//---Broadcasts messages to clients

import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Song } from './interfaces/rehearsals.interfaces';

// Constants for socket events
export const SOCKET_EVENT_SELECT_SONG = 'song-selected';
export const SOCKET_EVENT_JOIN_REHEARSAL = 'join-rehearsal';
export const SOCKET_EVENT_LEAVE_REHEARSAL = 'leave-rehearsal';
export const SOCKET_EVENT_END_REHEARSAL = 'end-rehearsal';
export const SOCKET_EVENT_USER_CONNECTED = 'user-connected';
export const SOCKET_EVENT_USER_DISCONNECTED = 'user-disconnected';

@WebSocketGateway({
  cors:
    process.env.NODE_ENV !== 'production'
      ? {
          origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
          credentials: true,
        }
      : false, // No CORS needed in production when serving from same origin
})
export class RehearsalsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('RehearsalsGateway');
  private userToSocketMap = new Map<string, string>(); // userId -> socketId
  private socketToUserMap = new Map<string, string>(); // socketId -> userId

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove user association if exists
    const userId = this.socketToUserMap.get(client.id);
    if (userId) {
      this.userToSocketMap.delete(userId);
      this.socketToUserMap.delete(client.id);
      // Notify others that user disconnected
      this.server.emit(SOCKET_EVENT_USER_DISCONNECTED, { userId });
    }
  }

  @SubscribeMessage('set-user-socket')
  handleSetUserSocket(client: Socket, userId: string) {
    this.logger.log(`Setting socket for user: ${userId}, socket: ${client.id}`);
    this.userToSocketMap.set(userId, client.id);
    this.socketToUserMap.set(client.id, userId);
    client.join(`user:${userId}`);
    this.server.emit(SOCKET_EVENT_USER_CONNECTED, { userId });
  }

  @SubscribeMessage('unset-user-socket')
  handleUnsetUserSocket(client: Socket) {
    const userId = this.socketToUserMap.get(client.id);
    if (userId) {
      this.logger.log(`Removing socket for user: ${userId}`);
      this.userToSocketMap.delete(userId);
      this.socketToUserMap.delete(client.id);
      client.leave(`user:${userId}`);
    }
  }

  @SubscribeMessage(SOCKET_EVENT_JOIN_REHEARSAL)
  handleJoinRehearsal(client: Socket, rehearsalId: string) {
    this.logger.log(`Socket ${client.id} joining rehearsal: ${rehearsalId}`);
    client.join(`rehearsal:${rehearsalId}`);
  }

  @SubscribeMessage(SOCKET_EVENT_LEAVE_REHEARSAL)
  handleLeaveRehearsal(client: Socket, rehearsalId: string) {
    this.logger.log(`Socket ${client.id} leaving rehearsal: ${rehearsalId}`);
    client.leave(`rehearsal:${rehearsalId}`);
  }

  @SubscribeMessage(SOCKET_EVENT_SELECT_SONG)
  handleSelectSong(client: Socket, data: { rehearsalId: string; song: Song }) {
    this.logger.log(
      `Song selected for rehearsal ${data.rehearsalId}: ${data.song.title}`,
    );
    this.server
      .to(`rehearsal:${data.rehearsalId}`)
      .emit(SOCKET_EVENT_SELECT_SONG, data.song);
  }

  @SubscribeMessage(SOCKET_EVENT_END_REHEARSAL)
  handleEndRehearsal(client: Socket, rehearsalId: string) {
    this.logger.log(`Ending rehearsal: ${rehearsalId}`);
    this.server
      .to(`rehearsal:${rehearsalId}`)
      .emit(SOCKET_EVENT_END_REHEARSAL, { rehearsalId });
  }

  // Utility methods to emit to specific users or groups
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRehearsal(rehearsalId: string, event: string, data: any) {
    this.server.to(`rehearsal:${rehearsalId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
