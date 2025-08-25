import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Mission } from '../entities/mission.entity';
import { UserMission } from '../entities/user-mission.entity';
import { GetMissionsDto } from './dto/get-missions.dto';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private missionsRepository: Repository<Mission>,
    @InjectRepository(UserMission)
    private userMissionsRepository: Repository<UserMission>,
  ) {}

  async getTodayMission(): Promise<Mission | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mission = await this.missionsRepository.findOne({
      where: {
        date: today,
        isActive: true,
      },
    });

    if (mission) {
      // 완료 통계 추가
      const completionCount = await this.userMissionsRepository.count({
        where: { missionId: mission.id, isCompleted: true },
      });
      const totalUsers = await this.userMissionsRepository.count({
        where: { missionId: mission.id },
      });

      mission.completionCount = completionCount;
      mission.totalUsers = totalUsers;
      mission.completionRate = totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
    }

    return mission;
  }

  async findAll(getMissionsDto: GetMissionsDto) {
    const { startDate, endDate, month } = getMissionsDto;
    const queryBuilder = this.missionsRepository
      .createQueryBuilder('mission')
      .where('mission.isActive = :isActive', { isActive: true })
      .orderBy('mission.date', 'DESC');

    if (month) {
      // YYYY-MM 형식으로 월별 조회
      const startOfMonth = new Date(`${month}-01`);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
      
      queryBuilder.andWhere('mission.date BETWEEN :startOfMonth AND :endOfMonth', {
        startOfMonth,
        endOfMonth,
      });
    } else {
      if (startDate) {
        queryBuilder.andWhere('mission.date >= :startDate', { startDate: new Date(startDate) });
      }
      if (endDate) {
        queryBuilder.andWhere('mission.date <= :endDate', { endDate: new Date(endDate) });
      }
    }

    const missions = await queryBuilder.getMany();

    // 각 미션에 완료 통계 추가
    for (const mission of missions) {
      const completionCount = await this.userMissionsRepository.count({
        where: { missionId: mission.id, isCompleted: true },
      });
      const totalUsers = await this.userMissionsRepository.count({
        where: { missionId: mission.id },
      });

      mission.completionCount = completionCount;
      mission.totalUsers = totalUsers;
      mission.completionRate = totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
    }

    return missions;
  }

  async findOne(id: string): Promise<Mission> {
    const mission = await this.missionsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    // 완료 통계 추가
    const completionCount = await this.userMissionsRepository.count({
      where: { missionId: mission.id, isCompleted: true },
    });
    const totalUsers = await this.userMissionsRepository.count({
      where: { missionId: mission.id },
    });

    mission.completionCount = completionCount;
    mission.totalUsers = totalUsers;
    mission.completionRate = totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;

    return mission;
  }

  async getMissionByDate(date: string): Promise<Mission | null> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const mission = await this.missionsRepository.findOne({
      where: {
        date: targetDate,
        isActive: true,
      },
    });

    if (mission) {
      // 완료 통계 추가
      const completionCount = await this.userMissionsRepository.count({
        where: { missionId: mission.id, isCompleted: true },
      });
      const totalUsers = await this.userMissionsRepository.count({
        where: { missionId: mission.id },
      });

      mission.completionCount = completionCount;
      mission.totalUsers = totalUsers;
      mission.completionRate = totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
    }

    return mission;
  }

  async toggleCompletion(missionId: string, userId: string): Promise<{ completed: boolean }> {
    const mission = await this.findOne(missionId);

    let userMission = await this.userMissionsRepository.findOne({
      where: { missionId, userId },
    });

    if (!userMission) {
      // 새로운 UserMission 생성
      userMission = this.userMissionsRepository.create({
        missionId,
        userId,
        isCompleted: true,
        completedAt: new Date(),
      });
    } else {
      // 기존 UserMission 토글
      userMission.isCompleted = !userMission.isCompleted;
      userMission.completedAt = userMission.isCompleted ? new Date() : null;
    }

    await this.userMissionsRepository.save(userMission);
    return { completed: userMission.isCompleted };
  }

  async getCompletionStatus(missionId: string, userId: string): Promise<{ completed: boolean }> {
    const userMission = await this.userMissionsRepository.findOne({
      where: { missionId, userId },
    });

    return { completed: userMission?.isCompleted || false };
  }

  async getUserProgress(userId: string, month?: string) {
    const queryBuilder = this.userMissionsRepository
      .createQueryBuilder('userMission')
      .leftJoinAndSelect('userMission.mission', 'mission')
      .where('userMission.userId = :userId', { userId })
      .orderBy('mission.date', 'DESC');

    if (month) {
      const startOfMonth = new Date(`${month}-01`);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
      
      queryBuilder.andWhere('mission.date BETWEEN :startOfMonth AND :endOfMonth', {
        startOfMonth,
        endOfMonth,
      });
    }

    const userMissions = await queryBuilder.getMany();
    
    const totalMissions = userMissions.length;
    const completedMissions = userMissions.filter(um => um.isCompleted).length;
    const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    return {
      userMissions,
      totalMissions,
      completedMissions,
      completionRate,
    };
  }
}
