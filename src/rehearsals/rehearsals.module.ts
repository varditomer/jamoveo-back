// src/rehearsals/rehearsals.module.ts
import { Module } from '@nestjs/common';
import { RehearsalsGateway } from './rehearsals.gateway';

@Module({
  providers: [RehearsalsGateway],
  exports: [RehearsalsGateway],
})
export class RehearsalsModule {}
