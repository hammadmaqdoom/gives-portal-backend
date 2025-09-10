import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from '../../src/classes/classes.service';
import { ClassRepository } from '../../src/classes/infrastructure/persistence/class.repository';
import { CreateClassDto } from '../../src/classes/dto/create-class.dto';

describe('ClassesService', () => {
  let service: ClassesService;
  let classRepository: jest.Mocked<ClassRepository>;

  beforeEach(async () => {
    const mockClassRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findManyWithPagination: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: ClassRepository,
          useValue: mockClassRepository,
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
    classRepository = module.get(ClassRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a class successfully', async () => {
      const createClassDto: CreateClassDto = {
        name: 'Advanced Mathematics 101',
        batchTerm: 'Aug 2025 – April 2026',
        weekdays: ['Tuesday', 'Thursday'],
        timing: '8:00PM–10:00PM',
        courseOutline:
          'Advanced mathematics course covering calculus and algebra',
        subject: { id: 1 },
        teacher: { id: 1 },
      };

      const expectedClass = {
        id: 1,
        name: 'Advanced Mathematics 101',
        batchTerm: 'Aug 2025 – April 2026',
        weekdays: ['Tuesday', 'Thursday'],
        timing: '8:00PM–10:00PM',
        courseOutline:
          'Advanced mathematics course covering calculus and algebra',
        subject: { id: 1 },
        teacher: { id: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      classRepository.create.mockResolvedValue(expectedClass as any);

      const result = await service.create(createClassDto);

      expect(result).toEqual(expectedClass);
      expect(classRepository.create).toHaveBeenCalledWith(createClassDto);
    });
  });

  describe('findById', () => {
    it('should return a class by id', async () => {
      const classId = 1;
      const expectedClass = {
        id: 1,
        name: 'Advanced Mathematics 101',
        batchTerm: 'Aug 2025 – April 2026',
        weekdays: ['Tuesday', 'Thursday'],
        timing: '8:00PM–10:00PM',
        courseOutline:
          'Advanced mathematics course covering calculus and algebra',
        subject: { id: 1 },
        teacher: { id: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      classRepository.findById.mockResolvedValue(expectedClass as any);

      const result = await service.findById(classId);

      expect(result).toEqual(expectedClass);
      expect(classRepository.findById).toHaveBeenCalledWith(classId);
    });

    it('should return null if class not found', async () => {
      const classId = 999;
      classRepository.findById.mockResolvedValue(null);

      const result = await service.findById(classId);

      expect(result).toBeNull();
    });
  });

  describe('findManyWithPagination', () => {
    it('should return paginated classes', async () => {
      const paginationOptions = {
        page: 1,
        limit: 10,
      };

      const expectedResult = [
        {
          id: 1,
          name: 'Advanced Mathematics 101',
          batchTerm: 'Aug 2025 – April 2026',
          weekdays: ['Tuesday', 'Thursday'],
          timing: '8:00PM–10:00PM',
          courseOutline:
            'Advanced mathematics course covering calculus and algebra',
          subject: { id: 1 },
          teacher: { id: 1 },
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      classRepository.findManyWithPagination.mockResolvedValue(
        expectedResult as any,
      );

      const result = await service.findManyWithPagination({
        paginationOptions,
      });

      expect(result).toEqual(expectedResult);
      expect(classRepository.findManyWithPagination).toHaveBeenCalledWith({
        paginationOptions,
      });
    });
  });
});
