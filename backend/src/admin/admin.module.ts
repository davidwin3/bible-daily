import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { MissionsModule } from '../missions/missions.module';
import { CellsModule } from '../cells/cells.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MissionsModule, CellsModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
