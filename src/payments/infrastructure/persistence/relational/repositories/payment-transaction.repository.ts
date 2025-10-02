import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  PaymentTransactionRepository,
  PaymentTransactionFilters,
  PaymentTransactionMeta,
} from '../../payment-transaction.repository';
import { PaymentTransaction } from 'src/payments/domain/payment-transaction';
import { PaymentTransactionEntity } from '../entities/payment-transaction.entity';
import { PaymentTransactionMapper } from '../mappers/payment-transaction.mapper';

@Injectable()
export class PaymentTransactionRepositoryImpl
  implements PaymentTransactionRepository
{
  constructor(
    @InjectRepository(PaymentTransactionEntity)
    private readonly transactionRepository: Repository<PaymentTransactionEntity>,
  ) {}

  async findById(id: number): Promise<PaymentTransaction | null> {
    const entity = await this.transactionRepository.findOne({
      where: { id },
      relations: ['gateway'],
    });
    return entity ? PaymentTransactionMapper.toDomain(entity) : null;
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<PaymentTransaction | null> {
    const entity = await this.transactionRepository.findOne({
      where: { transactionId },
      relations: ['gateway'],
    });
    return entity ? PaymentTransactionMapper.toDomain(entity) : null;
  }

  async findByGatewayTransactionId(
    gatewayTransactionId: string,
  ): Promise<PaymentTransaction | null> {
    const entity = await this.transactionRepository.findOne({
      where: { gatewayTransactionId },
      relations: ['gateway'],
    });
    return entity ? PaymentTransactionMapper.toDomain(entity) : null;
  }

  async findWithFilters(
    filters: PaymentTransactionFilters & {
      includeJoins?: boolean;
      classId?: number;
      teacherId?: number;
    },
  ): Promise<{
    data: PaymentTransaction[];
    meta: PaymentTransactionMeta;
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      gatewayId,
      studentId,
      startDate,
      endDate,
      includeJoins,
      classId,
      teacherId,
    } = filters;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.gateway', 'gateway')
      .leftJoinAndSelect('transaction.invoice', 'invoice')
      .leftJoinAndSelect('transaction.student', 'student')
      .leftJoinAndSelect('student.classEnrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.class', 'class')
      .leftJoinAndSelect('class.teacher', 'teacher')
      .leftJoinAndSelect('transaction.parent', 'parent')
      .orderBy('transaction.createdAt', 'DESC');
    if (classId) {
      queryBuilder.andWhere('enrollment.classId = :classId', { classId });
    }

    if (teacherId) {
      queryBuilder.andWhere('class.teacherId = :teacherId', { teacherId });
    }

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }

    if (gatewayId) {
      queryBuilder.andWhere('transaction.gatewayId = :gatewayId', {
        gatewayId,
      });
    }

    if (studentId) {
      queryBuilder.andWhere('transaction.studentId = :studentId', {
        studentId,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'transaction.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);

    const entities = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = includeJoins
      ? (entities as any)
      : entities.map(PaymentTransactionMapper.toDomain);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findByStudentId(
    studentId: number,
    filters?: Omit<PaymentTransactionFilters, 'studentId'>,
  ): Promise<{
    data: PaymentTransaction[];
    meta: PaymentTransactionMeta;
  }> {
    return this.findWithFilters({ ...filters, studentId });
  }

  async create(data: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    const entity = this.transactionRepository.create(
      PaymentTransactionMapper.toPersistence(data as PaymentTransaction),
    );
    const savedEntity = await this.transactionRepository.save(entity);
    return PaymentTransactionMapper.toDomain(
      savedEntity as PaymentTransactionEntity,
    );
  }

  async update(
    id: number,
    data: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction> {
    await this.transactionRepository.update(id, data);
    const updatedEntity = await this.transactionRepository.findOne({
      where: { id },
      relations: ['gateway'],
    });
    return PaymentTransactionMapper.toDomain(updatedEntity!);
  }

  async updateByTransactionId(
    transactionId: string,
    data: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction> {
    await this.transactionRepository.update({ transactionId }, data);
    const updatedEntity = await this.transactionRepository.findOne({
      where: { transactionId },
      relations: ['gateway'],
    });
    return PaymentTransactionMapper.toDomain(updatedEntity!);
  }

  async delete(id: number): Promise<void> {
    await this.transactionRepository.softDelete(id);
  }
}
