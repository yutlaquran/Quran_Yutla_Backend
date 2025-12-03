import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/guards/user.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';
import { UserQueryDto } from './dto/requests/find-user-query.dto';
import { PaginatedUserResponseDto } from './dto/responses/paginated-users.response.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { StudentsQueryDto } from './dto/requests/students-query.dto';
import { Auth } from 'src/common/guards/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @SuccessResponse('User list retrieved successfully', 200)
  @Serialize(PaginatedUserResponseDto)
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @SuccessResponse('User retrieved successfully', 200)
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Delete(':id')
  @SuccessResponse('User deleted successfully', 200)
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
