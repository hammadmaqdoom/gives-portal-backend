import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsService } from '../../src/subjects/subjects.service';
import { SubjectRepository } from '../../src/subjects/infrastructure/persistence/subject.repository';
import { CreateSubjectDto } from '../../src/subjects/dto/create-subject.dto';
import { UpdateSubjectDto } from '../../src/subjects/dto/update-subject.dto';
import { Subject } from '../../src/subjects/domain/subject';
import {
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';

describe('SubjectsService', () => {
  let service: SubjectsService;
  let subjectRepository: jest.Mocked<SubjectRepository>;

  beforeEach(async () => {
    const mockSubjectRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findManyWithPagination: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        {
          provide: SubjectRepository,
          useValue: mockSubjectRepository,
        },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
    subjectRepository = module.get(SubjectRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a subject successfully', async () => {
      const createSubjectDto: CreateSubjectDto = {
        name: 'Mathematics',
        description: 'Advanced mathematics course',
        defaultFee: 150.0,
      };

      const expectedSubject: Subject = {
        id: 1,
        name: 'Mathematics',
        description: 'Advanced mathematics course',
        defaultFee: 150.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      subjectRepository.findByName.mockResolvedValue(null);
      subjectRepository.create.mockResolvedValue(expectedSubject);

      const result = await service.create(createSubjectDto);

      expect(subjectRepository.findByName).toHaveBeenCalledWith(
        createSubjectDto.name,
      );
      expect(subjectRepository.create).toHaveBeenCalledWith(createSubjectDto);
      expect(result).toEqual(expectedSubject);
    });

    it('should throw UnprocessableEntityException when repository throws error', async () => {
      const createSubjectDto: CreateSubjectDto = {
        name: 'Mathematics',
        description: 'Advanced mathematics course',
        defaultFee: 150.0,
      };

      subjectRepository.findByName.mockResolvedValue(null);
      subjectRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createSubjectDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('findById', () => {
    it('should find a subject by ID successfully', async () => {
      const subjectId = 1;
      const expectedSubject: Subject = {
        id: 1,
        name: 'Mathematics',
        description: 'Advanced mathematics course',
        defaultFee: 150.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      subjectRepository.findById.mockResolvedValue(expectedSubject);

      const result = await service.findById(subjectId);

      expect(subjectRepository.findById).toHaveBeenCalledWith(subjectId);
      expect(result).toEqual(expectedSubject);
    });

    it('should return null when subject not found', async () => {
      const subjectId = 999;

      subjectRepository.findById.mockResolvedValue(null);

      const result = await service.findById(subjectId);

      expect(subjectRepository.findById).toHaveBeenCalledWith(subjectId);
      expect(result).toBeNull();
    });
  });

  describe('findManyWithPagination', () => {
    it('should find subjects with pagination successfully', async () => {
      const paginationOptions = {
        page: 1,
        limit: 10,
      };

      const filterOptions = {
        name: 'Mathematics',
      };

      const sortOptions = [
        {
          orderBy: 'name' as keyof Subject,
          order: 'ASC' as const,
        },
      ];

      const expectedSubjects: Subject[] = [
        {
          id: 1,
          name: 'Mathematics',
          description: 'Advanced mathematics course',
          defaultFee: 150.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      subjectRepository.findManyWithPagination.mockResolvedValue(
        expectedSubjects,
      );

      const result = await service.findManyWithPagination({
        paginationOptions,
        filterOptions,
        sortOptions,
      });

      expect(subjectRepository.findManyWithPagination).toHaveBeenCalledWith({
        paginationOptions,
        filterOptions,
        sortOptions,
      });
      expect(result).toEqual(expectedSubjects);
    });

    it('should handle empty results', async () => {
      const paginationOptions = {
        page: 1,
        limit: 10,
      };

      subjectRepository.findManyWithPagination.mockResolvedValue([]);

      const result = await service.findManyWithPagination({
        paginationOptions,
      });

      expect(subjectRepository.findManyWithPagination).toHaveBeenCalledWith({
        paginationOptions,
        filterOptions: undefined,
        sortOptions: undefined,
      });
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a subject successfully', async () => {
      const subjectId = 1;
      const updateSubjectDto: UpdateSubjectDto = {
        name: 'Mathematics Updated',
        description: 'Updated mathematics course',
        defaultFee: 200.0,
      };

      const expectedSubject: Subject = {
        id: 1,
        name: 'Mathematics Updated',
        description: 'Updated mathematics course',
        defaultFee: 200.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      subjectRepository.findByName.mockResolvedValue(null);
      subjectRepository.update.mockResolvedValue(expectedSubject);

      const result = await service.update(subjectId, updateSubjectDto);

      expect(subjectRepository.findByName).toHaveBeenCalledWith(
        updateSubjectDto.name,
      );
      expect(subjectRepository.update).toHaveBeenCalledWith(
        subjectId,
        updateSubjectDto,
      );
      expect(result).toEqual(expectedSubject);
    });

    it('should return null when subject not found for update', async () => {
      const subjectId = 999;
      const updateSubjectDto: UpdateSubjectDto = {
        name: 'Non-existent Subject',
      };

      subjectRepository.findByName.mockResolvedValue(null);
      subjectRepository.update.mockResolvedValue(null);

      const result = await service.update(subjectId, updateSubjectDto);

      expect(subjectRepository.findByName).toHaveBeenCalledWith(
        updateSubjectDto.name,
      );
      expect(subjectRepository.update).toHaveBeenCalledWith(
        subjectId,
        updateSubjectDto,
      );
      expect(result).toBeNull();
    });

    it('should throw UnprocessableEntityException when repository throws error', async () => {
      const subjectId = 1;
      const updateSubjectDto: UpdateSubjectDto = {
        name: 'Mathematics Updated',
      };

      subjectRepository.findByName.mockResolvedValue(null);
      subjectRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.update(subjectId, updateSubjectDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a subject successfully', async () => {
      const subjectId = 1;

      subjectRepository.remove.mockResolvedValue(undefined);

      await service.remove(subjectId);

      expect(subjectRepository.remove).toHaveBeenCalledWith(subjectId);
    });

    it('should throw NotFoundException when subject not found for removal', async () => {
      const subjectId = 999;

      const error = new Error('Subject not found');
      error.name = 'EntityNotFound';
      subjectRepository.remove.mockRejectedValue(error);

      await expect(service.remove(subjectId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
