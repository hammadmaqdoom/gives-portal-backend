import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBatchTermDto } from './dto/create-batch-term.dto';
import { NullableType } from '../utils/types/nullable.type';
import { BatchTermRepository } from './infrastructure/persistence/batch-term.repository';
import { BatchTerm } from './domain/batch-term';
import { UpdateBatchTermDto } from './dto/update-batch-term.dto';

@Injectable()
export class BatchTermsService {
  constructor(private readonly batchTermsRepository: BatchTermRepository) {}

  async create(createBatchTermDto: CreateBatchTermDto): Promise<BatchTerm> {
    const existingBatchTerm = await this.batchTermsRepository.findByName(
      createBatchTermDto.name,
    );
    if (existingBatchTerm) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'batchTermNameAlreadyExists',
        },
      });
    }

    return this.batchTermsRepository.create({
      ...createBatchTermDto,
      isActive: createBatchTermDto.isActive ?? true,
      displayOrder: createBatchTermDto.displayOrder ?? 0,
    });
  }

  async findAll(activeOnly: boolean = false): Promise<BatchTerm[]> {
    return this.batchTermsRepository.findAll(activeOnly);
  }

  async findById(id: BatchTerm['id']): Promise<NullableType<BatchTerm>> {
    return this.batchTermsRepository.findById(id);
  }

  async update(
    id: BatchTerm['id'],
    updateBatchTermDto: UpdateBatchTermDto,
  ): Promise<BatchTerm> {
    const batchTerm = await this.batchTermsRepository.findById(id);

    if (!batchTerm) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          batchTerm: 'batchTermNotFound',
        },
      });
    }

    if (updateBatchTermDto.name && updateBatchTermDto.name !== batchTerm.name) {
      const existingBatchTerm = await this.batchTermsRepository.findByName(
        updateBatchTermDto.name,
      );
      if (existingBatchTerm && existingBatchTerm.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            name: 'batchTermNameAlreadyExists',
          },
        });
      }
    }

    const updatedBatchTerm = await this.batchTermsRepository.update(
      id,
      updateBatchTermDto,
    );

    if (!updatedBatchTerm) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          batchTerm: 'batchTermNotFound',
        },
      });
    }

    return updatedBatchTerm;
  }

  async remove(id: BatchTerm['id']): Promise<void> {
    const batchTerm = await this.batchTermsRepository.findById(id);

    if (!batchTerm) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          batchTerm: 'batchTermNotFound',
        },
      });
    }

    await this.batchTermsRepository.remove(id);
  }
}
