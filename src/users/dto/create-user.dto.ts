import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  flag_active?: boolean;

  @ApiPropertyOptional({
    description: 'ISO date-time',
    example: '2030-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiration_at?: string;
}
