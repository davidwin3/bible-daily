import { Test, TestingModule } from '@nestjs/testing';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { GetMissionsDto } from './dto/get-missions.dto';

describe('MissionsController', () => {
  let controller: MissionsController;
  let service: MissionsService;

  const mockMissionsService = {
    getTodayMission: jest.fn(),
    findAll: jest.fn(),
    getMissionByDate: jest.fn(),
    findOne: jest.fn(),
    toggleCompletion: jest.fn(),
    getCompletionStatus: jest.fn(),
    getUserProgress: jest.fn(),
    createMission: jest.fn(),
    updateMission: jest.fn(),
    deleteMission: jest.fn(),
    softDeleteMission: jest.fn(),
    getAllMissionsForAdmin: jest.fn(),
    getMissionStatistics: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAdminGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MissionsController],
      providers: [
        {
          provide: MissionsService,
          useValue: mockMissionsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<MissionsController>(MissionsController);
    service = module.get<MissionsService>(MissionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Admin endpoints', () => {
    describe('createMission', () => {
      it('should create a mission', async () => {
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

        const expectedResult = {
          id: '1',
          ...createMissionDto,
          isActive: true,
        };

        mockMissionsService.createMission.mockResolvedValue(expectedResult);

        const result = await controller.createMission(createMissionDto);

        expect(service.createMission).toHaveBeenCalledWith(createMissionDto);
        expect(result).toEqual(expectedResult);
      });
    });

    describe('updateMission', () => {
      it('should update a mission', async () => {
        const updateMissionDto: UpdateMissionDto = {
          title: '수정된 미션',
          description: '수정된 설명',
        };

        const expectedResult = {
          id: '1',
          title: '수정된 미션',
          description: '수정된 설명',
          isActive: true,
        };

        mockMissionsService.updateMission.mockResolvedValue(expectedResult);

        const result = await controller.updateMission('1', updateMissionDto);

        expect(service.updateMission).toHaveBeenCalledWith(
          '1',
          updateMissionDto,
        );
        expect(result).toEqual(expectedResult);
      });
    });

    describe('deleteMission', () => {
      it('should delete a mission', async () => {
        mockMissionsService.deleteMission.mockResolvedValue(undefined);

        const result = await controller.deleteMission('1');

        expect(service.deleteMission).toHaveBeenCalledWith('1');
        expect(result).toEqual({ message: 'Mission deleted successfully' });
      });
    });

    describe('softDeleteMission', () => {
      it('should soft delete a mission', async () => {
        const expectedResult = {
          id: '1',
          title: '테스트 미션',
          isActive: false,
        };

        mockMissionsService.softDeleteMission.mockResolvedValue(expectedResult);

        const result = await controller.softDeleteMission('1');

        expect(service.softDeleteMission).toHaveBeenCalledWith('1');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('getAllMissionsForAdmin', () => {
      it('should get all missions for admin', async () => {
        const getMissionsDto: GetMissionsDto = {
          month: '2024-01',
        };

        const expectedResult = [
          {
            id: '1',
            title: '테스트 미션',
            date: '2024-01-15',
            completionCount: 10,
            totalUsers: 20,
            completionRate: 50,
          },
        ];

        mockMissionsService.getAllMissionsForAdmin.mockResolvedValue(
          expectedResult,
        );

        const result = await controller.getAllMissionsForAdmin(getMissionsDto);

        expect(service.getAllMissionsForAdmin).toHaveBeenCalledWith(
          getMissionsDto,
        );
        expect(result).toEqual(expectedResult);
      });
    });

    describe('getMissionStatistics', () => {
      it('should get mission statistics', async () => {
        const expectedResult = {
          totalMissions: 10,
          totalUserMissions: 100,
          completedUserMissions: 80,
          overallCompletionRate: 80,
        };

        mockMissionsService.getMissionStatistics.mockResolvedValue(
          expectedResult,
        );

        const result = await controller.getMissionStatistics();

        expect(service.getMissionStatistics).toHaveBeenCalled();
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('Public endpoints', () => {
    describe('getTodayMission', () => {
      it('should get today mission', async () => {
        const expectedResult = {
          id: '1',
          title: '오늘의 미션',
          date: new Date().toISOString().split('T')[0],
        };

        mockMissionsService.getTodayMission.mockResolvedValue(expectedResult);

        const result = await controller.getTodayMission();

        expect(service.getTodayMission).toHaveBeenCalled();
        expect(result).toEqual(expectedResult);
      });
    });

    describe('findAll', () => {
      it('should find all missions', async () => {
        const getMissionsDto: GetMissionsDto = {};
        const expectedResult = [
          {
            id: '1',
            title: '테스트 미션',
            date: '2024-01-15',
          },
        ];

        mockMissionsService.findAll.mockResolvedValue(expectedResult);

        const result = await controller.findAll(getMissionsDto);

        expect(service.findAll).toHaveBeenCalledWith(getMissionsDto);
        expect(result).toEqual(expectedResult);
      });
    });

    describe('getMissionByDate', () => {
      it('should get mission by date', async () => {
        const expectedResult = {
          id: '1',
          title: '테스트 미션',
          date: '2024-01-15',
        };

        mockMissionsService.getMissionByDate.mockResolvedValue(expectedResult);

        const result = await controller.getMissionByDate('2024-01-15');

        expect(service.getMissionByDate).toHaveBeenCalledWith('2024-01-15');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('findOne', () => {
      it('should find one mission', async () => {
        const expectedResult = {
          id: '1',
          title: '테스트 미션',
          date: '2024-01-15',
        };

        mockMissionsService.findOne.mockResolvedValue(expectedResult);

        const result = await controller.findOne('1');

        expect(service.findOne).toHaveBeenCalledWith('1');
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('User endpoints', () => {
    const mockRequest = {
      user: { id: 'user-1', email: 'test@test.com' },
    };

    describe('toggleCompletion', () => {
      it('should toggle completion', async () => {
        const expectedResult = {
          missionId: '1',
          userId: 'user-1',
          isCompleted: true,
        };

        mockMissionsService.toggleCompletion.mockResolvedValue(expectedResult);

        const result = await controller.toggleCompletion('1', mockRequest);

        expect(service.toggleCompletion).toHaveBeenCalledWith('1', 'user-1');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('getCompletionStatus', () => {
      it('should get completion status', async () => {
        const expectedResult = {
          missionId: '1',
          userId: 'user-1',
          isCompleted: true,
        };

        mockMissionsService.getCompletionStatus.mockResolvedValue(
          expectedResult,
        );

        const result = await controller.getCompletionStatus('1', mockRequest);

        expect(service.getCompletionStatus).toHaveBeenCalledWith('1', 'user-1');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('getUserProgress', () => {
      it('should get user progress', async () => {
        const expectedResult = {
          totalMissions: 10,
          completedMissions: 8,
          completionRate: 80,
        };

        mockMissionsService.getUserProgress.mockResolvedValue(expectedResult);

        const result = await controller.getUserProgress(mockRequest, '2024-01');

        expect(service.getUserProgress).toHaveBeenCalledWith(
          'user-1',
          '2024-01',
        );
        expect(result).toEqual(expectedResult);
      });
    });
  });
});
