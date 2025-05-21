import { Controller, Get, Post, Query } from '@nestjs/common';
import { OkxService } from './okx.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('OKX')
@Controller('okx')
export class OkxController {
  constructor(private readonly okxService: OkxService) {}

  @Get()
  @ApiOperation({ summary: 'Get all OKX data' })
  findAll() {
    return this.okxService.findAll();
  }

  @Get('quote')
  @ApiOperation({ summary: 'Get swap quote' })
  @ApiQuery({ name: 'fromTokenAddress', required: true })
  @ApiQuery({ name: 'toTokenAddress', required: true })
  @ApiQuery({ name: 'amount', required: true })
  getQuote(
    @Query('fromTokenAddress') fromTokenAddress: string,
    @Query('toTokenAddress') toTokenAddress: string,
    @Query('amount') amount: string,
  ) {
    return this.okxService.getQuote(fromTokenAddress, toTokenAddress, amount);
  }

  @Post('swap')
  @ApiOperation({ summary: 'Execute token swap' })
  @ApiQuery({ name: 'fromTokenAddress', required: true })
  @ApiQuery({ name: 'toTokenAddress', required: true })
  @ApiQuery({ name: 'amount', required: true })
  executeSwap(
    @Query('fromTokenAddress') fromTokenAddress: string,
    @Query('toTokenAddress') toTokenAddress: string,
    @Query('amount') amount: string,
  ) {
    return this.okxService.executeSwap(
      fromTokenAddress,
      toTokenAddress,
      amount,
    );
  }
}
