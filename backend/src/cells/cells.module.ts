import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CellsService } from './cells.service';
import { CellsController } from './cells.controller';
import { Cell } from '../entities/cell.entity';
import { CellMember } from '../entities/cell-member.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cell, CellMember, User])],
  providers: [CellsService],
  controllers: [CellsController],
  exports: [CellsService],
})
export class CellsModule {}
