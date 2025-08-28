import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { MissionsService } from '../missions/missions.service';
import { CellsService } from '../cells/cells.service';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly missionsService: MissionsService,
    private readonly cellsService: CellsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    const [missionStats, cellStats, userStats] = await Promise.all([
      this.missionsService.getMissionStatistics(),
      this.cellsService.getCellStatistics(),
      this.usersService.getUserStatistics(),
    ]);

    return {
      overview: {
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        totalCells: cellStats.totalCells,
        totalMissions: missionStats.totalMissions,
        overallCompletionRate: missionStats.overallCompletionRate,
      },
      missions: {
        totalMissions: missionStats.totalMissions,
        totalUserMissions: missionStats.totalUserMissions,
        completedUserMissions: missionStats.completedUserMissions,
        overallCompletionRate: missionStats.overallCompletionRate,
        recentStats: missionStats.recentStats,
      },
      cells: {
        totalCells: cellStats.totalCells,
        totalMembers: cellStats.totalMembers,
        averageMembersPerCell: cellStats.averageMembersPerCell,
        topActiveCells: cellStats.topActiveCells,
      },
      users: {
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        inactiveUsers: userStats.inactiveUsers,
        roleDistribution: userStats.roleDistribution,
        recentActiveUsers: userStats.recentActiveUsers,
        usersInCells: userStats.usersInCells,
        usersNotInCells: userStats.usersNotInCells,
        newUsers: userStats.newUsers,
        activityRate: userStats.activityRate,
      },
    };
  }
}
