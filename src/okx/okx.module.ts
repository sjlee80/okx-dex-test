import { Module } from '@nestjs/common';
import { OkxService } from './okx.service';
import { OkxController } from './okx.controller';

@Module({
  controllers: [OkxController],
  providers: [OkxService],
})
export class OkxModule {}
