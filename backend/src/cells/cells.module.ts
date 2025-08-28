import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CellsService } from './cells.service';
import { CellsController } from './cells.controller';
import { Cell } from '../entities/cell.entity';
import { CellMember } from '../entities/cell-member.entity';
import { User } from '../entities/user.entity';
import { UserMission } from '../entities/user-mission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cell, CellMember, User, UserMission])],
  providers: [CellsService],
  controllers: [CellsController],
  exports: [CellsService],
})
export class CellsModule {}
