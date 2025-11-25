import { Test, TestingModule } from '@nestjs/testing';
import { ParentsService } from '../../src/parents/parents.service';
import { ParentRepository } from '../../src/parents/infrastructure/persistence/parent.repository';
import { CreateParentDto } from '../../src/parents/dto/create-parent.dto';
import { UnprocessableEntityException } from '@nestjs/common';

describe('ParentsService', () => {
  let service: ParentsService;
  let parentRepository: jest.Mocked<ParentRepository>;

  beforeEach(async () => {
    const mockParentRepository = {
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
        ParentsService,
        {
          provide: ParentRepository,
          useValue: mockParentRepository,
        },
      ],
    }).compile();

    service = module.get<ParentsService>(ParentsService);
    parentRepository = module.get(ParentRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a parent with hashed passcode', async () => {
      const createParentDto: CreateParentDto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        passcode: '123456',
      };

      const mockParent = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        passcode: 'hashed_passcode',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      parentRepository.findByEmail.mockResolvedValue(null);
      parentRepository.findByPhone.mockResolvedValue(null);
      parentRepository.create.mockResolvedValue(mockParent as any);

      const result = await service.create(createParentDto);

      expect(parentRepository.findByEmail).toHaveBeenCalledWith(
        'john@example.com',
      );
      expect(parentRepository.findByPhone).toHaveBeenCalledWith('+1234567890');
      expect(parentRepository.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        passcode: expect.stringMatching(
          /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/,
        ), // bcrypt hash pattern
      });
      expect(result).toEqual(mockParent);
    });

    it('should throw error if email already exists', async () => {
      const createParentDto: CreateParentDto = {
        name: 'John Doe',
        email: 'existing@example.com',
        passcode: '123456',
      };

      const existingParent = {
        id: 2,
        name: 'Existing User',
        email: 'existing@example.com',
      };

      parentRepository.findByEmail.mockResolvedValue(existingParent as any);

      await expect(service.create(createParentDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(parentRepository.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
    });

    it('should throw error if phone already exists', async () => {
      const createParentDto: CreateParentDto = {
        name: 'John Doe',
        phone: '+1234567890',
        passcode: '123456',
      };

      const existingParent = {
        id: 2,
        name: 'Existing User',
        phone: '+1234567890',
      };

      parentRepository.findByEmail.mockResolvedValue(null);
      parentRepository.findByPhone.mockResolvedValue(existingParent as any);

      await expect(service.create(createParentDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(parentRepository.findByPhone).toHaveBeenCalledWith('+1234567890');
    });
  });

  describe('findById', () => {
    it('should return a parent by id', async () => {
      const mockParent = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      parentRepository.findById.mockResolvedValue(mockParent as any);

      const result = await service.findById(1);

      expect(parentRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockParent);
    });
  });

  describe('findByEmail', () => {
    it('should return a parent by email', async () => {
      const mockParent = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      parentRepository.findByEmail.mockResolvedValue(mockParent as any);

      const result = await service.findByEmail('john@example.com');

      expect(parentRepository.findByEmail).toHaveBeenCalledWith(
        'john@example.com',
      );
      expect(result).toEqual(mockParent);
    });
  });
});
