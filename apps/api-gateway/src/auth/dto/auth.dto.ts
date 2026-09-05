import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@dealhunter.com', description: 'User email' })
  @IsEmail({}, { message: 'Must be a valid email' })
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Password (min 6 chars)' })
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@dealhunter.com', description: 'User email' })
  @IsEmail({}, { message: 'Must be a valid email' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User password' })
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsNotEmpty()
  refreshToken!: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT Access Token' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT Refresh Token' })
  refreshToken!: string;

  @ApiProperty({ description: 'User profile payload' })
  user!: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
