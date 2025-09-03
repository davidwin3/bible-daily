import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
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

    // 하위 호환성: 기존 단일 구절 형식 지원
    let scriptureData = scriptures;
    if (!scriptures || scriptures.length === 0) {
      const {
        startBook,
        startChapter,
        startVerse,
        endBook,
        endChapter,
        endVerse,
      } = createMissionDto;

      if (startBook && startChapter) {
        scriptureData = [
          {
            startBook,
            startChapter,
            startVerse,
            endBook: endBook || startBook,
            endChapter,
            endVerse,
            order: 0,
          },
        ];
      }
    }

    const mission = this.missionsRepository.create({
      date: new Date(date),
      title,
      description,
      // 하위 호환성을 위해 첫 번째 구절을 메인 필드에 저장
      startBook: scriptureData?.[0]?.startBook,
      startChapter: scriptureData?.[0]?.startChapter,
      startVerse: scriptureData?.[0]?.startVerse,
      endBook: scriptureData?.[0]?.endBook,
      endChapter: scriptureData?.[0]?.endChapter,
      endVerse: scriptureData?.[0]?.endVerse,
    });

    const savedMission = await this.missionsRepository.save(mission);

    // 성경구절들 저장
    if (scriptureData && scriptureData.length > 0) {
      const missionScriptures = scriptureData.map((scripture) =>
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
    if (
      updateMissionDto.date &&
      updateMissionDto.date !== mission.date.toISOString().split('T')[0]
    ) {
      const existingMission = await this.missionsRepository.findOne({
        where: { date: new Date(updateMissionDto.date) },
      });

      if (existingMission) {
        throw new ConflictException('Mission for this date already exists');
      }
    }

    // 기존 성경구절들 삭제
    if (mission.scriptures && mission.scriptures.length > 0) {
      await this.missionScripturesRepository.remove(mission.scriptures);
    }

    // 업데이트할 필드들 설정
    const { scriptures, ...missionUpdates } = updateMissionDto;

    // 하위 호환성: 새로운 scriptures가 없으면 기존 단일 구절 형식 사용
    let scriptureData = scriptures;
    if (!scriptures || scriptures.length === 0) {
      const {
        startBook,
        startChapter,
        startVerse,
        endBook,
        endChapter,
        endVerse,
      } = updateMissionDto;

      if (startBook && startChapter) {
        scriptureData = [
          {
            startBook,
            startChapter,
            startVerse,
            endBook: endBook || startBook,
            endChapter,
            endVerse,
            order: 0,
          },
        ];
      }
    }

    Object.assign(mission, {
      ...missionUpdates,
      date: updateMissionDto.date
        ? new Date(updateMissionDto.date)
        : mission.date,
      // 하위 호환성을 위해 첫 번째 구절을 메인 필드에 저장
      startBook: scriptureData?.[0]?.startBook || mission.startBook,
      startChapter: scriptureData?.[0]?.startChapter || mission.startChapter,
      startVerse: scriptureData?.[0]?.startVerse || mission.startVerse,
      endBook: scriptureData?.[0]?.endBook || mission.endBook,
      endChapter: scriptureData?.[0]?.endChapter || mission.endChapter,
      endVerse: scriptureData?.[0]?.endVerse || mission.endVerse,
    });

    const savedMission = await this.missionsRepository.save(mission);

    // 새로운 성경구절들 저장
    if (scriptureData && scriptureData.length > 0) {
      const missionScriptures = scriptureData.map((scripture) =>
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

      recentStats.push({
        date: mission.date,
        title:
          mission.title || `${mission.startBook} ${mission.startChapter}장`,
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
