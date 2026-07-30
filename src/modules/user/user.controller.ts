import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  HttpStatus,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../common/guards/user.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';
import { UserQueryDto } from './dto/requests/find-user-query.dto';
import { PaginatedUserResponseDto } from './dto/responses/paginated-users.response.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { Auth } from 'src/common/guards/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { LinkParentDto } from './dto/requests/link-parent.dto';
import { LinkMultipleChildrenDto } from './dto/requests/link-multiple-children.dto';
import { LinkTeacherDto } from './dto/requests/link-teacher.dto';
import { SuspendUserDto } from './dto/requests/suspend-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @SuccessResponse('User list retrieved successfully', 200)
  @Serialize(PaginatedUserResponseDto)
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get('admin/statistics')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get aggregated user statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @SuccessResponse('User statistics retrieved successfully', 200)
  async getStatistics() {
    return this.userService.getUserStatistics();
  }

  @Patch(':id/suspend')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Suspend a user account (Admin only)' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @SuccessResponse('User suspended successfully', 200)
  async suspendUser(
    @CurrentUser() admin: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() suspendUserDto: SuspendUserDto,
  ) {
    return this.userService.suspendUser(admin.id, id, suspendUserDto.reason);
  }

  @Patch(':id/activate')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Reactivate a suspended user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @SuccessResponse('User activated successfully', 200)
  async activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.activateUser(id);
  }

  @Delete(':id/permanent')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Permanently delete a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User permanently deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @SuccessResponse('User permanently deleted', 200)
  async permanentlyDelete(
    @CurrentUser() admin: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.userService.permanentlyDeleteUser(admin.id, id);
    return { deleted: true };
  }

  // ==================== Parent-Child Linking ====================

  @Post('link-parent')
  @Auth(RolesEnum.PARENT)
  @ApiOperation({ summary: 'Link a child to parent using student code' })
  @ApiResponse({ status: 200, description: 'Child linked successfully' })
  @ApiResponse({ status: 404, description: 'Student not found or already has a parent' })
  @SuccessResponse('Child linked successfully', 200)
  async linkParent(
    @CurrentUser() parent: User,
    @Body() linkParentDto: LinkParentDto,
  ) {
    return await this.userService.linkParent(parent.id, linkParentDto.studentCode);
  }

  @Post('link-multiple-children')
  @Auth(RolesEnum.PARENT)
  @ApiOperation({ summary: 'Link multiple children to parent using student codes' })
  @ApiResponse({ status: 200, description: 'Children linked successfully' })
  @SuccessResponse('Children linking process completed', 200)
  async linkMultipleChildren(
    @CurrentUser() parent: User,
    @Body() linkMultipleChildrenDto: LinkMultipleChildrenDto,
  ) {
    return await this.userService.linkMultipleChildren(
      parent.id,
      linkMultipleChildrenDto.studentCodes,
    );
  }

  @Get('children')
  @Auth(RolesEnum.PARENT)
  @ApiOperation({ summary: 'Get all children linked to the parent' })
  @ApiResponse({ status: 200, description: 'Children retrieved successfully' })
  @SuccessResponse('Children retrieved successfully', 200)
  async getChildren(@CurrentUser() parent: User) {
    return await this.userService.getChildren(parent.id);
  }

  // ==================== Teacher-Student Linking ====================

  @Post('link-teacher')
  @Auth(RolesEnum.TEACHER)
  @ApiOperation({ summary: 'Link a student to teacher' })
  @ApiResponse({ status: 200, description: 'Student linked successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @SuccessResponse('Student linked successfully', 200)
  async linkTeacher(
    @CurrentUser() teacher: User,
    @Body() linkTeacherDto: LinkTeacherDto,
  ) {
    return await this.userService.linkTeacher(teacher.id, linkTeacherDto.studentId);
  }

  @Get('students')
  @Auth(RolesEnum.TEACHER)
  @ApiOperation({ summary: 'Get all students linked to the teacher' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  @SuccessResponse('Students retrieved successfully', 200)
  async getStudents(@CurrentUser() teacher: User) {
    return await this.userService.getStudents(teacher.id);
  }

  @Get(':id')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get any user by id (Admin only)' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @SuccessResponse('User retrieved successfully', 200)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Delete(':id')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Soft-delete any user by id (Admin only)' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @SuccessResponse('User deleted successfully', 200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
