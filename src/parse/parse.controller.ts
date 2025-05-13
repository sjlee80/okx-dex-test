import { Controller, Get, Query, Param } from '@nestjs/common';
import { ParseService } from './parse.service';
import { ParseSignatureDto } from './dto/parse.dto';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('parse')
@Controller('parse')
export class ParseController {
  constructor(private readonly parseService: ParseService) {}

  @Get()
  @ApiQuery({ name: 'signature', required: true })
  async findAll(@Query() query: ParseSignatureDto) {
    return this.parseService.parseTransaction(query.signature);
  }

  @Get('contract/:address')
  @ApiParam({
    name: 'address',
    required: true,
    description: 'Contract address',
  })
  async getContractAssets(@Param('address') address: string) {
    return this.parseService.getContractAssets(address);
  }
}
