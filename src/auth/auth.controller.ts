import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.authService.register(createUserDto);
      return { success: true, user };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('register-admin')
  async registerAdmin(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.authService.register(createUserDto, true);
      return { success: true, user };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Admin registration failed';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    try {
      // Now we pass the whole DTO object instead of extracting username/password
      const result = await this.authService.login(loginUserDto);
      return { success: true, ...result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }
}
