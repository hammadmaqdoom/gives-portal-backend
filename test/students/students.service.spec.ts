import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from '../../src/students/students.service';
import { StudentRepository } from '../../src/students/infrastructure/persistence/student.repository';
import { FilesService } from '../../src/files/files.service';
import { CreateStudentDto } from '../../src/students/dto/create-student.dto';

describe('StudentsService', () => {
  let service: StudentsService;
  let studentRepository: jest.Mocked<StudentRepository>;
  let filesService: jest.Mocked<FilesService>;

  beforeEach(async () => {
    const mockStudentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByStudentId: jest.fn(),
      findManyWithPagination: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      generateStudentId: jest.fn(),
    };

    const mockFilesService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: StudentRepository,
          useValue: mockStudentRepository,
        },
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    studentRepository = module.get(StudentRepository);
    filesService = module.get(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a student with auto-generated student ID', async () => {
      const createStudentDto: CreateStudentDto = {
        name: 'John Doe',
        address: '123 Main St',
        contact: '+1234567890',
      };

      const mockStudent = {
        id: 1,
        studentId: 'STD-0001',
        name: 'John Doe',
        address: '123 Main St',
        contact: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      studentRepository.generateStudentId.mockResolvedValue('STD-0001');
      studentRepository.create.mockResolvedValue(mockStudent as any);

      const result = await service.create(createStudentDto);

      expect(studentRepository.generateStudentId).toHaveBeenCalled();
      expect(studentRepository.create).toHaveBeenCalledWith({
        studentId: 'STD-0001',
        name: 'John Doe',
        address: '123 Main St',
        contact: '+1234567890',
        photo: undefined,
        class: undefined,
        parent: undefined,
      });
      expect(result).toEqual(mockStudent);
    });

    it('should create a student with photo', async () => {
      const createStudentDto: CreateStudentDto = {
        name: 'John Doe',
        photo: { id: 'photo-uuid' },
      };

      const mockFile = {
        id: 'photo-uuid',
        path: '/uploads/photo.jpg',
      };

      const mockStudent = {
        id: 1,
        studentId: 'STD-0001',
        name: 'John Doe',
        photo: mockFile,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      studentRepository.generateStudentId.mockResolvedValue('STD-0001');
      filesService.findById.mockResolvedValue(mockFile as any);
      studentRepository.create.mockResolvedValue(mockStudent as any);

      const result = await service.create(createStudentDto);

      expect(filesService.findById).toHaveBeenCalledWith('photo-uuid');
      expect(result).toEqual(mockStudent);
    });
  });

  describe('findById', () => {
    it('should return a student by id', async () => {
      const mockStudent = {
        id: 1,
        studentId: 'STD-0001',
        name: 'John Doe',
      };

      studentRepository.findById.mockResolvedValue(mockStudent as any);

      const result = await service.findById(1);

      expect(studentRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStudent);
    });
  });

  describe('findByStudentId', () => {
    it('should return a student by student ID', async () => {
      const mockStudent = {
        id: 1,
        studentId: 'STD-0001',
        name: 'John Doe',
      };

      studentRepository.findByStudentId.mockResolvedValue(mockStudent as any);

      const result = await service.findByStudentId('STD-0001');

      expect(studentRepository.findByStudentId).toHaveBeenCalledWith(
        'STD-0001',
      );
      expect(result).toEqual(mockStudent);
    });
  });
});
