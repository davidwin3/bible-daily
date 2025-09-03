import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Mission } from '../entities/mission.entity';
import { UserMission } from '../entities/user-mission.entity';
import { GetMissionsDto } from './dto/get-missions.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

@Injectable()
export class MissionsServiceOptimized {
  constructor(
    @InjectRepository(Mission)
    private missionsRepository: Repository<Mission>,
    @InjectRepository(UserMission)
    private userMissionsRepository: Repository<UserMission>,
  ) {}

  /**
   * 최적화된 오늘의 미션 조회
   * - 단일 쿼리로 통계 정보까지 함께 조회
   */
  async getTodayMission(userId?: string): Promise<Mission | null> {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 변환
    const today = new Date().toISOString().split('T')[0];

    const queryBuilder = this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoin('mission.userMissions', 'userMission')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN userMission.isCompleted = true THEN userMission.id END)',
        'completionCount',
      )
      .addSelect('COUNT(DISTINCT userMission.id)', 'totalUsers')
      .where('mission.date = :today', { today })
      .andWhere('mission.isActive = :isActive', { isActive: true })
      .groupBy('mission.id');

    // 사용자별 완료 상태 조회 (로그인한 경우)
    if (userId) {
      queryBuilder
        .leftJoin(
          'mission.userMissions',
          'myUserMission',
          'myUserMission.userId = :userId',
          { userId },
        )
        .addSelect(
          'CASE WHEN myUserMission.isCompleted = true THEN true ELSE false END',
          'isCompleted',
        );
    }

    const result = await queryBuilder.getRawAndEntities();

    if (!result.entities.length) {
      return null;
    }

    const mission = result.entities[0];
    const raw = result.raw[0];

    const completionCount = parseInt(raw.completionCount) || 0;
    const totalUsers = parseInt(raw.totalUsers) || 0;

    return {
      ...mission,
      completionCount,
      totalUsers,
      completionRate: totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0,
      isCompleted: userId ? raw.isCompleted === '1' : false,
    } as Mission;
  }

  /**
   * 최적화된 미션 목록 조회
   * - 단일 쿼리로 모든 통계 정보 조회
   * - 불필요한 반복 쿼리 제거
   */
  async findAll(getMissionsDto: GetMissionsDto, userId?: string) {
    const { startDate, endDate, month } = getMissionsDto;

    const queryBuilder = this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoin('mission.userMissions', 'userMission')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN userMission.isCompleted = true THEN userMission.id END)',
        'completionCount',
      )
      .addSelect('COUNT(DISTINCT userMission.id)', 'totalUsers')
      .where('mission.isActive = :isActive', { isActive: true })
      .groupBy('mission.id')
      .orderBy('mission.date', 'DESC');

    // 사용자별 완료 상태 조회 (로그인한 경우)
    if (userId) {
      queryBuilder
        .leftJoin(
          'mission.userMissions',
          'myUserMission',
          'myUserMission.userId = :userId',
          { userId },
        )
        .addSelect(
          'CASE WHEN myUserMission.isCompleted = true THEN true ELSE false END',
          'isCompleted',
        );
    }

    // 날짜 필터링
    if (month) {
      const startOfMonth = new Date(`${month}-01`);
      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 1,
        0,
      );

      // DATE 타입 컬럼에 맞춰 YYYY-MM-DD 형식으로 변환
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

      queryBuilder.andWhere(
        'mission.date BETWEEN :startOfMonth AND :endOfMonth',
        {
          startOfMonth: startDateStr,
          endOfMonth: endDateStr,
        },
      );
    } else {
      if (startDate) {
        // DATE 타입 컬럼에 맞춰 YYYY-MM-DD 형식으로 변환
        const startDateStr = new Date(startDate).toISOString().split('T')[0];
        queryBuilder.andWhere('mission.date >= :startDate', {
          startDate: startDateStr,
        });
      }
      if (endDate) {
        // DATE 타입 컬럼에 맞춰 YYYY-MM-DD 형식으로 변환
        const endDateStr = new Date(endDate).toISOString().split('T')[0];
        queryBuilder.andWhere('mission.date <= :endDate', {
          endDate: endDateStr,
        });
      }
    }

    const result = await queryBuilder.getRawAndEntities();

    // 결과 매핑
    const missions = result.entities.map((mission, index) => {
      const raw = result.raw[index];
      const completionCount = parseInt(raw.completionCount) || 0;
      const totalUsers = parseInt(raw.totalUsers) || 0;

      return {
        ...mission,
        completionCount,
        totalUsers,
        completionRate:
          totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0,
        isCompleted: userId ? raw.isCompleted === '1' : false,
      };
    });

    return missions;
  }

  /**
   * 최적화된 단일 미션 조회
   */
  async findOne(id: string, userId?: string): Promise<Mission> {
    const queryBuilder = this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoin('mission.userMissions', 'userMission')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN userMission.isCompleted = true THEN userMission.id END)',
        'completionCount',
      )
      .addSelect('COUNT(DISTINCT userMission.id)', 'totalUsers')
      .where('mission.id = :id', { id })
      .andWhere('mission.isActive = :isActive', { isActive: true })
      .groupBy('mission.id');

    if (userId) {
      queryBuilder
        .leftJoin(
          'mission.userMissions',
          'myUserMission',
          'myUserMission.userId = :userId',
          { userId },
        )
        .addSelect(
          'CASE WHEN myUserMission.isCompleted = true THEN true ELSE false END',
          'isCompleted',
        );
    }

    const result = await queryBuilder.getRawAndEntities();

    if (!result.entities.length) {
      throw new NotFoundException('Mission not found');
    }

    const mission = result.entities[0];
    const raw = result.raw[0];

    const completionCount = parseInt(raw.completionCount) || 0;
    const totalUsers = parseInt(raw.totalUsers) || 0;

    return {
      ...mission,
      completionCount,
      totalUsers,
      completionRate: totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0,
      isCompleted: userId ? raw.isCompleted === '1' : false,
    } as Mission;
  }

  /**
   * 최적화된 사용자 진행률 조회
   * - 월별 통계를 단일 쿼리로 조회
   */
  async getUserProgress(userId: string, month?: string) {
    const queryBuilder = this.userMissionsRepository
      .createQueryBuilder('userMission')
      .leftJoinAndSelect('userMission.mission', 'mission')
      .where('userMission.userId = :userId', { userId })
      .andWhere('mission.isActive = :isActive', { isActive: true })
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
        { startOfMonth, endOfMonth },
      );
    }

    const userMissions = await queryBuilder.getMany();

    // 통계 계산
    const totalMissions = userMissions.length;
    const completedMissions = userMissions.filter(
      (um) => um.isCompleted,
    ).length;
    const completionRate =
      totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    // 연속 완료 일수 계산
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    const sortedMissions = userMissions.sort(
      (a, b) =>
        new Date(b.mission.date).getTime() - new Date(a.mission.date).getTime(),
    );

    for (const userMission of sortedMissions) {
      if (userMission.isCompleted) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);

        // 현재 연속 기록 (오늘부터 역순으로)
        if (
          currentStreak === 0 ||
          new Date(userMission.mission.date).getTime() ===
            new Date().getTime() - currentStreak * 24 * 60 * 60 * 1000
        ) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    return {
      totalMissions,
      completedMissions,
      completionRate,
      currentStreak,
      maxStreak,
      missions: userMissions,
    };
  }

  /**
   * 최적화된 미션 완료 토글
   * - 트랜잭션 사용으로 데이터 일관성 보장
   */
  async toggleCompletion(
    missionId: string,
    userId: string,
  ): Promise<{ isCompleted: boolean; completionCount: number }> {
    return await this.missionsRepository.manager.transaction(
      async (manager) => {
        // 미션 존재 확인
        const mission = await manager.findOne(Mission, {
          where: { id: missionId, isActive: true },
        });

        if (!mission) {
          throw new NotFoundException('Mission not found');
        }

        // 기존 사용자 미션 확인
        let userMission = await manager.findOne(UserMission, {
          where: { missionId, userId },
        });

        if (!userMission) {
          // 새로운 사용자 미션 생성
          userMission = manager.create(UserMission, {
            missionId,
            userId,
            isCompleted: true,
            completedAt: new Date(),
          });
        } else {
          // 기존 사용자 미션 토글
          userMission.isCompleted = !userMission.isCompleted;
          userMission.completedAt = userMission.isCompleted ? new Date() : null;
        }

        await manager.save(userMission);

        // 완료 수 계산
        const completionCount = await manager.count(UserMission, {
          where: { missionId, isCompleted: true },
        });

        return {
          isCompleted: userMission.isCompleted,
          completionCount,
        };
      },
    );
  }

  /**
   * 미션 생성
   */
  async create(createMissionDto: CreateMissionDto): Promise<Mission> {
    // 날짜 중복 체크 - DATE 타입 컬럼에 맞춰 YYYY-MM-DD 형식으로 변환
    const dateStr = new Date(createMissionDto.date).toISOString().split('T')[0];

    const existingMission = await this.missionsRepository
      .createQueryBuilder('mission')
      .where('mission.date = :date', { date: dateStr })
      .getOne();

    if (existingMission) {
      throw new ConflictException('Mission already exists for this date');
    }

    const mission = this.missionsRepository.create({
      ...createMissionDto,
      date: new Date(dateStr + 'T00:00:00.000Z'), // UTC 기준으로 날짜만 설정
    });
    return await this.missionsRepository.save(mission);
  }

  /**
   * 미션 수정
   */
  async update(
    id: string,
    updateMissionDto: UpdateMissionDto,
  ): Promise<Mission> {
    const mission = await this.findOne(id);

    await this.missionsRepository.update(id, updateMissionDto);
    return await this.findOne(id);
  }

  /**
   * 미션 삭제 (소프트 삭제)
   */
  async remove(id: string): Promise<void> {
    const mission = await this.findOne(id);

    await this.missionsRepository.update(id, {
      isActive: false,
    });
  }

  /**
   * 캐시 가능한 월별 통계 조회
   */
  async getMonthlyStats(month: string) {
    const startOfMonth = new Date(`${month}-01`);
    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0,
    );

    const result = await this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoin('mission.userMissions', 'userMission')
      .select('COUNT(DISTINCT mission.id)', 'totalMissions')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN userMission.isCompleted = true THEN userMission.id END)',
        'totalCompletions',
      )
      .addSelect('COUNT(DISTINCT userMission.userId)', 'activeUsers')
      .where('mission.date BETWEEN :startOfMonth AND :endOfMonth', {
        startOfMonth,
        endOfMonth,
      })
      .andWhere('mission.isActive = :isActive', { isActive: true })
      .getRawOne();

    return {
      month,
      totalMissions: parseInt(result.totalMissions) || 0,
      totalCompletions: parseInt(result.totalCompletions) || 0,
      activeUsers: parseInt(result.activeUsers) || 0,
      averageCompletionRate:
        result.totalMissions > 0
          ? (result.totalCompletions /
              (result.totalMissions * result.activeUsers)) *
            100
          : 0,
    };
  }
}
