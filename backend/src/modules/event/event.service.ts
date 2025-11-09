import { Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { EventGateway } from '../event/event.gateway';
import { UserTypeEnum } from './enum/user-type.enum';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private configService: ConfigService,
    private eventGateway: EventGateway,
  ) {}

  sendMessage(userType: UserTypeEnum, message: string, isError?: boolean): void {
    const date = new Date().toISOString();
    this.eventGateway.server.emit('message', {
      username: userType,
      message: message,
      isError: isError ?? false,
      timestamp: date,
    });
    this.logger.log(message);
  }
}
