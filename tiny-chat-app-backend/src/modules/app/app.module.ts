import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ChatModule } from '../chat/chat.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../config/configuration';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerModuleOptions,
  ThrottlerOptions,
} from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ChatModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttle: ThrottlerOptions = {
          ttl: configService.get<number>('throttle.ttl') as number, // Time to live in milliseconds
          limit: configService.get<number>('throttle.limit') as number, // Maximum number of requests within the ttl
        };

        const options: ThrottlerModuleOptions = {
          throttlers: [throttle],
        };

        return options;
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
