import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventGateway } from './event.gateway';

@Module({
  imports: [ConfigModule],
  providers: [EventGateway],
  exports: [EventGateway],
})
export class EventModule {}
