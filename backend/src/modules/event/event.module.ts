import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventGateway } from './event.gateway';
import { EventService } from './event.service';

@Module({
  imports: [ConfigModule],
  providers: [EventGateway, EventService],
  exports: [EventGateway, EventService],
})
export class EventModule {}
