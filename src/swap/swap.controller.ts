import { Controller, Get, Post, Body } from '@nestjs/common';
import { SwapService } from './swap.service';
import { CreateSwapDto } from './dto/req.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Swap')
@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @Get('balance')
  async getBalance() {
    return this.swapService.getBalance();
  }

  @Post('trade')
  async trade(@Body() createSwapDto: CreateSwapDto) {
    return this.swapService.trade(createSwapDto);
  }
}
