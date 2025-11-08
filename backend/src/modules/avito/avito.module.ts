import { forwardRef, Module } from '@nestjs/common';
import { AvitoService } from './avito.service';
import { AvitoController } from './avito.controller';
import { ConfigModule } from '@nestjs/config';
import { EventModule } from '../event/event.module';

@Module({
  imports: [ConfigModule, forwardRef(() => EventModule)],
  controllers: [AvitoController],
  providers: [AvitoService],
  exports: [AvitoService],
})
export class AvitoModule {}
