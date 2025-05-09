import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateSwapDto {
  @IsString()
  @ApiProperty({
    description: 'The mint address of the output token',
    example: '7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o',
  })
  outputMint: string;

  @IsNumber()
  @ApiProperty({
    description: 'The amount of the output token',
    example: 1,
  })
  amount: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The mint address of the input token',
    example: 'So11111111111111111111111111111111111111112',
  })
  inputMint?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'The slippage percentage',
    example: 0.1,
  })
  slippage?: number;
}
