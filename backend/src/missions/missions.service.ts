import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Mission } from '../entities/mission.entity';
import { MissionScripture } from '../entities/mission-scripture.entity';
import { UserMission } from '../entities/user-mission.entity';
import { GetMissionsDto } from './dto/get-missions.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private missionsRepository: Repository<Mission>,
    @InjectRepository(MissionScripture)
    private missionScripturesRepository: Repository<MissionScripture>,
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
      mission.completionRate =
        totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
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
      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 1,
        0,
      );

      queryBuilder.andWhere(
        'mission.date BETWEEN :startOfMonth AND :endOfMonth',
        {
          startOfMonth,
          endOfMonth,
        },
      );
    } else {
      if (startDate) {
        queryBuilder.andWhere('mission.date >= :startDate', {
          startDate: new Date(startDate),
        });
      }
      if (endDate) {
        queryBuilder.andWhere('mission.date <= :endDate', {
          endDate: new Date(endDate),
        });
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
      mission.completionRate =
        totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
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
    mission.completionRate =
      totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;

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
      mission.completionRate =
        totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
    }

    return mission;
  }

  async toggleCompletion(
    missionId: string,
    userId: string,
  ): Promise<{ completed: boolean }> {
    await this.findOne(missionId);

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

  async getCompletionStatus(
    missionId: string,
    userId: string,
  ): Promise<{ completed: boolean }> {
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
      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 1,
        0,
      );

      queryBuilder.andWhere(
        'mission.date BETWEEN :startOfMonth AND :endOfMonth',
        {
          startOfMonth,
          endOfMonth,
        },
      );
    }

    const userMissions = await queryBuilder.getMany();

    const totalMissions = userMissions.length;
    const completedMissions = userMissions.filter(
      (um) => um.isCompleted,
    ).length;
    const completionRate =
      totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    return {
      userMissions,
      totalMissions,
      completedMissions,
      completionRate,
    };
  }

  // Admin only methods
  async createMission(createMissionDto: CreateMissionDto): Promise<Mission> {
    const { date, scriptures, title, description } = createMissionDto;

    // 날짜 중복 체크
    const existingMission = await this.missionsRepository.findOne({
      where: { date: new Date(date) },
    });

    if (existingMission) {
      throw new ConflictException('Mission for this date already exists');
    }

    const mission = this.missionsRepository.create({
      date: new Date(date),
      title,
      description,
    });

    const savedMission = await this.missionsRepository.save(mission);

    // 성경구절들 저장
    if (scriptures && scriptures.length > 0) {
      const missionScriptures = scriptures.map((scripture) =>
        this.missionScripturesRepository.create({
          ...scripture,
          missionId: savedMission.id,
        }),
      );

      await this.missionScripturesRepository.save(missionScriptures);
    }

    return savedMission;
  }

  async updateMission(
    id: string,
    updateMissionDto: UpdateMissionDto,
  ): Promise<Mission> {
    const mission = await this.missionsRepository.findOne({
      where: { id, isActive: true },
      relations: ['scriptures'],
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    // 날짜가 변경되는 경우 중복 체크
    if (updateMissionDto.date) {
      const existingMission = await this.missionsRepository.findOne({
        where: { date: new Date(updateMissionDto.date) },
      });

      if (existingMission && existingMission.id !== id) {
        throw new ConflictException('Mission for this date already exists');
      }
    }

    // 기존 성경구절들 삭제
    if (mission.scriptures && mission.scriptures.length > 0) {
      await this.missionScripturesRepository.remove(mission.scriptures);
    }

    // 업데이트할 필드들 설정
    const { scriptures, ...missionUpdates } = updateMissionDto;

    Object.assign(mission, {
      ...missionUpdates,
      date: updateMissionDto.date
        ? new Date(updateMissionDto.date)
        : mission.date,
    });

    const savedMission = await this.missionsRepository.save(mission);

    // 새로운 성경구절들 저장
    if (scriptures && scriptures.length > 0) {
      const missionScriptures = scriptures.map((scripture) =>
        this.missionScripturesRepository.create({
          ...scripture,
          missionId: savedMission.id,
        }),
      );

      await this.missionScripturesRepository.save(missionScriptures);
    }

    return savedMission;
  }

  async deleteMission(id: string): Promise<void> {
    const mission = await this.missionsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    // 사용자 활동이 있는지 체크
    const userMissionCount = await this.userMissionsRepository.count({
      where: { missionId: id },
    });

    if (userMissionCount > 0) {
      throw new ConflictException(
        'Cannot delete mission with user activities. Use soft delete instead.',
      );
    }

    await this.missionsRepository.remove(mission);
  }

  async softDeleteMission(id: string): Promise<Mission> {
    const mission = await this.missionsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    mission.isActive = false;
    return await this.missionsRepository.save(mission);
  }

  async getAllMissionsForAdmin(getMissionsDto: GetMissionsDto) {
    const { startDate, endDate, month } = getMissionsDto;
    const queryBuilder = this.missionsRepository
      .createQueryBuilder('mission')
      .orderBy('mission.date', 'DESC');

    if (month) {
      const startOfMonth = new Date(`${month}-01`);
      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 1,
        0,
      );

      queryBuilder.andWhere(
        'mission.date BETWEEN :startOfMonth AND :endOfMonth',
        {
          startOfMonth,
          endOfMonth,
        },
      );
    } else {
      if (startDate) {
        queryBuilder.andWhere('mission.date >= :startDate', {
          startDate: new Date(startDate),
        });
      }
      if (endDate) {
        queryBuilder.andWhere('mission.date <= :endDate', {
          endDate: new Date(endDate),
        });
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
      mission.completionRate =
        totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
    }

    return missions;
  }

  async getMissionStatistics() {
    const totalMissions = await this.missionsRepository.count({
      where: { isActive: true },
    });
    const totalUserMissions = await this.userMissionsRepository.count();
    const completedUserMissions = await this.userMissionsRepository.count({
      where: { isCompleted: true },
    });

    const overallCompletionRate =
      totalUserMissions > 0
        ? (completedUserMissions / totalUserMissions) * 100
        : 0;

    // 최근 7일 통계
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMissions = await this.missionsRepository.find({
      where: {
        date: MoreThanOrEqual(sevenDaysAgo),
        isActive: true,
      },
      relations: ['scriptures'],
      order: { date: 'DESC' },
    });

    const recentStats: any[] = [];
    for (const mission of recentMissions) {
      const completionCount = await this.userMissionsRepository.count({
        where: { missionId: mission.id, isCompleted: true },
      });
      const totalUsers = await this.userMissionsRepository.count({
        where: { missionId: mission.id },
      });

      // scriptures에서 첫 번째 구절로 제목 생성
      let defaultTitle = '미션';
      if (mission.scriptures && mission.scriptures.length > 0) {
        const firstScripture = mission.scriptures[0];
        defaultTitle = `${firstScripture.startBook} ${firstScripture.startChapter}장`;
      }

      recentStats.push({
        date: mission.date,
        title: mission.title || defaultTitle,
        completionCount,
        totalUsers,
        completionRate:
          totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0,
      });
    }

    return {
      totalMissions,
      totalUserMissions,
      completedUserMissions,
      overallCompletionRate,
      recentStats,
    };
  }
}
