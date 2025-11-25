import { Test, TestingModule } from '@nestjs/testing';
import { TeachersService } from '../../src/teachers/teachers.service';
import { TeacherRepository } from '../../src/teachers/infrastructure/persistence/teacher.repository';
import { CreateTeacherDto } from '../../src/teachers/dto/create-teacher.dto';
import { UnprocessableEntityException } from '@nestjs/common';

describe('TeachersService', () => {
  let service: TeachersService;
  let teacherRepository: jest.Mocked<TeacherRepository>;

  beforeEach(async () => {
    const mockTeacherRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findManyWithPagination: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        {
          provide: TeacherRepository,
          useValue: mockTeacherRepository,
        },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
    teacherRepository = module.get(TeacherRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a teacher successfully', async () => {
      const createTeacherDto: CreateTeacherDto = {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@school.com',
        phone: '+1234567890',
        commissionPercentage: 15.5,
        subjectsAllowed: ['Mathematics', 'Physics'],
      };

      const expectedTeacher = {
        id: 1,
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@school.com',
        phone: '+1234567890',
        commissionPercentage: 15.5,
        subjectsAllowed: ['Mathematics', 'Physics'],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      teacherRepository.create.mockResolvedValue(expectedTeacher);

      const result = await service.create(createTeacherDto);

      expect(result).toEqual(expectedTeacher);
      expect(teacherRepository.create).toHaveBeenCalledWith(createTeacherDto);
    });

    it('should throw error if email already exists', async () => {
      const createTeacherDto: CreateTeacherDto = {
        name: 'Dr. Sarah Johnson',
        email: 'existing@school.com',
        phone: '+1234567890',
        commissionPercentage: 15.5,
        subjectsAllowed: ['Mathematics'],
      };

      teacherRepository.findByEmail.mockResolvedValue({
        id: 1,
        name: 'Existing Teacher',
        email: 'existing@school.com',
        phone: '+1234567890',
        commissionPercentage: 10,
        subjectsAllowed: ['Physics'],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await expect(service.create(createTeacherDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('findById', () => {
    it('should return a teacher by id', async () => {
      const teacherId = 1;
      const expectedTeacher = {
        id: 1,
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@school.com',
        phone: '+1234567890',
        commissionPercentage: 15.5,
        subjectsAllowed: ['Mathematics', 'Physics'],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      teacherRepository.findById.mockResolvedValue(expectedTeacher);

      const result = await service.findById(teacherId);

      expect(result).toEqual(expectedTeacher);
      expect(teacherRepository.findById).toHaveBeenCalledWith(teacherId);
    });

    it('should return null if teacher not found', async () => {
      const teacherId = 999;
      teacherRepository.findById.mockResolvedValue(null);

      const result = await service.findById(teacherId);

      expect(result).toBeNull();
    });
  });

  describe('findManyWithPagination', () => {
    it('should return paginated teachers', async () => {
      const paginationOptions = {
        page: 1,
        limit: 10,
      };

      const expectedResult = [
        {
          id: 1,
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@school.com',
          phone: '+1234567890',
          commissionPercentage: 15.5,
          subjectsAllowed: ['Mathematics', 'Physics'],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      teacherRepository.findManyWithPagination.mockResolvedValue(
        expectedResult,
      );

      const result = await service.findManyWithPagination({
        paginationOptions,
      });

      expect(result).toEqual(expectedResult);
      expect(teacherRepository.findManyWithPagination).toHaveBeenCalledWith({
        paginationOptions,
      });
    });
  });
});
