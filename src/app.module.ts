import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { RehearsalsModule } from './rehearsals/rehearsals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // This is crucial - makes config available throughout the app
    }),
    AuthModule,
    DatabaseModule,
    RehearsalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
