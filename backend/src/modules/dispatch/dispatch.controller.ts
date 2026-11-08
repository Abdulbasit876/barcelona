import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';
import {
  AssignDriverDto,
  CreateAssignmentRuleDto,
  UnassignDriverDto,
} from './dispatch.dto';
import { DispatchService } from './dispatch.service';

@ApiTags('Dispatch Engine')
@Controller(['api/v1/dispatch', 'dispatch'])
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post('assign')
  @ApiOperation({ summary: 'Assign a driver to a booking with conflict checking & push alert' })
  async assignDriver(@Body() dto: AssignDriverDto, @CurrentUser() user: any) {
    return this.dispatchService.assignDriver(dto, user?.name || user?.email || 'ADMIN');
  }

  @Post('unassign')
  @ApiOperation({ summary: 'Unassign driver from booking' })
  async unassignDriver(@Body() dto: UnassignDriverDto, @CurrentUser() user: any) {
    return this.dispatchService.unassignDriver(dto, user?.name || user?.email || 'ADMIN');
  }

  @Post('auto-assign/:bookingId')
  @ApiOperation({ summary: 'Execute rule-based auto-assignment for a booking' })
  async autoAssign(@Param('bookingId') bookingId: string) {
    return this.dispatchService.autoAssign(bookingId);
  }

  @Get('board')
  @ApiOperation({ summary: 'Get Live Dispatch Board (unassigned, assigned, in-progress, completed)' })
  async getDispatchBoard() {
    return this.dispatchService.getDispatchBoard();
  }

  @Get('rules')
  @ApiOperation({ summary: 'List driver category assignment rules (e.g. Economy -> Driver ABCD)' })
  async getRules() {
    return this.dispatchService.getRules();
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create category assignment rule' })
  async createRule(@Body() dto: CreateAssignmentRuleDto) {
    return this.dispatchService.createRule(dto);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete category assignment rule' })
  async deleteRule(@Param('id') id: string) {
    return this.dispatchService.deleteRule(id);
  }
}

