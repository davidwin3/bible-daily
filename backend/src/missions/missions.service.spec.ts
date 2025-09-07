import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { Mission } from '../entities/mission.entity';
import { MissionScripture } from '../entities/mission-scripture.entity';
import { UserMission } from '../entities/user-mission.entity';
import { User } from '../entities/user.entity';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

describe('MissionsService', () => {
  let service: MissionsService;
  let missionRepository: Repository<Mission>;
  let missionScriptureRepository: Repository<MissionScripture>;
  let userMissionRepository: Repository<UserMission>;
  let userRepository: Repository<User>;

  const mockMissionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMissionScriptureRepository = {
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserMissionRepository = {
    count: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionsService,
        {
          provide: getRepositoryToken(Mission),
          useValue: mockMissionRepository,
        },
        {
          provide: getRepositoryToken(MissionScripture),
          useValue: mockMissionScriptureRepository,
        },
        {
          provide: getRepositoryToken(UserMission),
          useValue: mockUserMissionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<MissionsService>(MissionsService);
    missionRepository = module.get<Repository<Mission>>(
      getRepositoryToken(Mission),
    );
    missionScriptureRepository = module.get<Repository<MissionScripture>>(
      getRepositoryToken(MissionScripture),
    );
    userMissionRepository = module.get<Repository<UserMission>>(
      getRepositoryToken(UserMission),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Reset all mocks
    jest.clearAllMocks();
    mockMissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMission', () => {
    it('should create a mission successfully', async () => {
      const createMissionDto: CreateMissionDto = {
        date: '2024-01-15',
        scriptures: [
          {
            startBook: '마태복음',
            startChapter: 1,
            startVerse: 1,
            endBook: '마태복음',
            endChapter: 1,
            endVerse: 10,
            order: 0,
          },
        ],
        title: '테스트 미션',
        description: '테스트 미션 설명',
      };

      const mockMission = {
        id: '1',
        date: new Date('2024-01-15T00:00:00.000Z'),
        title: '테스트 미션',
        description: '테스트 미션 설명',
        isActive: true,
      };

      const mockScripture = {
        id: '1',
        startBook: '마태복음',
        startChapter: 1,
        startVerse: 1,
        endBook: '마태복음',
        endChapter: 1,
        endVerse: 10,
        order: 0,
        missionId: '1',
      };

      mockQueryBuilder.getOne.mockResolvedValue(null); // 중복 미션 없음
      mockMissionRepository.create.mockReturnValue(mockMission);
      mockMissionRepository.save.mockResolvedValue(mockMission);
      mockMissionScriptureRepository.create.mockReturnValue(mockScripture);
      mockMissionScriptureRepository.save.mockResolvedValue([mockScripture]);

      const result = await service.createMission(createMissionDto);

      expect(result).toEqual(mockMission);
      expect(mockMissionRepository.create).toHaveBeenCalledWith({
        date: new Date('2024-01-15T00:00:00.000Z'),
        title: '테스트 미션',
        description: '테스트 미션 설명',
      });
      expect(mockMissionRepository.save).toHaveBeenCalledWith(mockMission);
      expect(mockMissionScriptureRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when mission already exists for date', async () => {
      const createMissionDto: CreateMissionDto = {
        date: '2024-01-15',
        scriptures: [],
        title: '테스트 미션',
        description: '테스트 미션 설명',
      };

      const existingMission = { id: '1', date: '2024-01-15' };
      mockQueryBuilder.getOne.mockResolvedValue(existingMission);

      await expect(service.createMission(createMissionDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateMission', () => {
    it('should update a mission successfully', async () => {
      const updateMissionDto: UpdateMissionDto = {
        title: '수정된 미션',
        description: '수정된 설명',
        scriptures: [
          {
            startBook: '요한복음',
            startChapter: 1,
            startVerse: 1,
            order: 0,
          },
        ],
      };

      const existingMission = {
        id: '1',
        date: new Date('2024-01-15'),
        title: '기존 미션',
        description: '기존 설명',
        scriptures: [
          {
            id: 'existing-scripture-1',
            startBook: '창세기',
            startChapter: 1,
            startVerse: 1,
            order: 0,
            missionId: '1',
          },
        ],
        isActive: true,
      };

      const updatedMission = {
        ...existingMission,
        title: '수정된 미션',
        description: '수정된 설명',
      };

      // 트랜잭션 매니저 모킹
      const mockTransactionManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(existingMission) // 첫 번째 호출
          .mockResolvedValueOnce(updatedMission), // 두 번째 호출 (결과 반환용)
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        }),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        save: jest.fn().mockResolvedValue([]),
      };

      mockMissionRepository.manager = {
        transaction: jest.fn().mockImplementation(async (callback) => {
          return await callback(mockTransactionManager);
        }),
      };

      const result = await service.updateMission('1', updateMissionDto);

      expect(result).toEqual(updatedMission);
      expect(mockMissionRepository.manager.transaction).toHaveBeenCalled();
      expect(mockTransactionManager.delete).toHaveBeenCalledWith(
        'MissionScripture',
        {
          missionId: '1',
        },
      );
      expect(mockTransactionManager.save).toHaveBeenCalledWith(
        'MissionScripture',
        [
          {
            startBook: '요한복음',
            startChapter: 1,
            startVerse: 1,
            order: 0,
            missionId: '1',
          },
        ],
      );
    });

    it('should throw NotFoundException when mission not found', async () => {
      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      mockMissionRepository.manager = {
        transaction: jest.fn().mockImplementation(async (callback) => {
          return await callback(mockTransactionManager);
        }),
      };

      await expect(
        service.updateMission('999', { title: '수정된 미션' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMission', () => {
    it('should delete a mission when no user activities exist', async () => {
      const mockMission = {
        id: '1',
        title: '테스트 미션',
        isActive: true,
      };

      mockMissionRepository.findOne.mockResolvedValue(mockMission);
      mockUserMissionRepository.count.mockResolvedValue(0); // 사용자 활동 없음
      mockMissionRepository.remove.mockResolvedValue(undefined);

      await service.deleteMission('1');

      expect(mockMissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });
      expect(mockUserMissionRepository.count).toHaveBeenCalledWith({
        where: { missionId: '1' },
      });
      expect(mockMissionRepository.remove).toHaveBeenCalledWith(mockMission);
    });

    it('should throw ConflictException when user activities exist', async () => {
      const mockMission = {
        id: '1',
        title: '테스트 미션',
        isActive: true,
      };

      mockMissionRepository.findOne.mockResolvedValue(mockMission);
      mockUserMissionRepository.count.mockResolvedValue(5); // 사용자 활동 있음

      await expect(service.deleteMission('1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when mission not found', async () => {
      mockMissionRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteMission('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDeleteMission', () => {
    it('should soft delete a mission successfully', async () => {
      const mockMission = {
        id: '1',
        title: '테스트 미션',
        isActive: true,
      };

      const softDeletedMission = {
        ...mockMission,
        isActive: false,
      };

      mockMissionRepository.findOne.mockResolvedValue(mockMission);
      mockMissionRepository.save.mockResolvedValue(softDeletedMission);

      const result = await service.softDeleteMission('1');

      expect(result).toEqual(softDeletedMission);
      expect(mockMissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });
      expect(mockMissionRepository.save).toHaveBeenCalledWith({
        ...mockMission,
        isActive: false,
      });
    });

    it('should throw NotFoundException when mission not found', async () => {
      mockMissionRepository.findOne.mockResolvedValue(null);

      await expect(service.softDeleteMission('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllMissionsForAdmin', () => {
    it('should return missions for admin with statistics', async () => {
      const mockMissions = [
        {
          id: '1',
          date: new Date('2024-01-15'),
          title: '테스트 미션',
          scriptures: [],
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockMissions);
      mockUserMissionRepository.count
        .mockResolvedValueOnce(10) // completionCount
        .mockResolvedValueOnce(20); // totalUsers

      const result = await service.getAllMissionsForAdmin({});

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        completionCount: 10,
        totalUsers: 20,
        completionRate: 50,
      });
    });

    it('should filter missions by month', async () => {
      const mockMissions = [];
      mockQueryBuilder.getMany.mockResolvedValue(mockMissions);

      await service.getAllMissionsForAdmin({ month: '2024-01' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'mission.date BETWEEN :startOfMonth AND :endOfMonth',
        {
          startOfMonth: '2024-01-01',
          endOfMonth: '2024-01-31',
        },
      );
    });
  });
});
