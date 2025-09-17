import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { Mission } from '../entities/mission.entity';
import { MissionScripture } from '../entities/mission-scripture.entity';
import { UserMission } from '../entities/user-mission.entity';
import { User } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mission, MissionScripture, UserMission, User]),
    NotificationsModule,
  ],
  providers: [MissionsService],
  controllers: [MissionsController],
  exports: [MissionsService],
})
export class MissionsModule {}
