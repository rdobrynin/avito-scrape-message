import { Module } from '@nestjs/common';
import { AvitoService } from './avito.service';
import { AvitoController } from './avito.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [AvitoController],
  providers: [AvitoService],
  exports: [AvitoService],
})
export class AvitoModule {}
