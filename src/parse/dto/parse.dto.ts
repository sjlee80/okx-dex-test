import { IsString, IsNotEmpty } from 'class-validator';

export class ParseSignatureDto {
  @IsString()
  @IsNotEmpty()
  signature: string;
}
