import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { FeeEntity } from '../entities/fee.entity';
import { Fee, PaymentStatus } from '../../../../domain/fee';
import { FeeMapper } from '../mappers/fee.mapper';
import { FeeRepository } from '../../fee.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { FilterFeeDto, SortFeeDto } from '../../../../dto/query-fee.dto';

@Injectable()
export class FeesRelationalRepository implements FeeRepository {
  constructor(
    @InjectRepository(FeeEntity)
    private readonly feesRepository: Repository<FeeEntity>,
    private readonly feeMapper: FeeMapper,
  ) {}

  async create(data: Partial<Fee>): Promise<Fee> {
    const feeEntity = this.feeMapper.toPersistence(data);
    const newFee = await this.feesRepository.save(
      this.feesRepository.create(feeEntity),
    );
    return this.feeMapper.toDomain(newFee);
  }

  async findById(id: Fee['id']): Promise<NullableType<Fee>> {
    console.log('findById called with id:', id, 'type:', typeof id);

    if (!id || isNaN(id)) {
      console.log('Invalid id, returning null');
      return null;
    }

    const fee = await this.feesRepository.findOne({
      where: { id },
    });
    return fee ? this.feeMapper.toDomain(fee) : null;
  }

  async findByStudent(studentId: number): Promise<Fee[]> {
    console.log(
      'findByStudent called with studentId:',
      studentId,
      'type:',
      typeof studentId,
    );

    if (!studentId || isNaN(studentId)) {
      console.log('Invalid studentId, returning empty array');
      return [];
    }

    const fees = await this.feesRepository.find({
      where: { student: { id: studentId } },
    });
    return fees.map((fee) => this.feeMapper.toDomain(fee));
  }

  async findByClass(classId: number): Promise<Fee[]> {
    const fees = await this.feesRepository.find({
      where: { class: { id: classId } },
    });
    return fees.map((fee) => this.feeMapper.toDomain(fee));
  }

  async findByStudentAndClass(
    studentId: number,
    classId: number,
  ): Promise<Fee[]> {
    const fees = await this.feesRepository.find({
      where: {
        student: { id: studentId },
        class: { id: classId },
      },
    });
    return fees.map((fee) => this.feeMapper.toDomain(fee));
  }

  async findOverdueFees(): Promise<Fee[]> {
    const overdueFees = await this.feesRepository.find({
      where: {
        dueDate: LessThan(new Date()),
        status: PaymentStatus.UNPAID,
      },
    });
    return overdueFees.map((fee) => this.feeMapper.toDomain(fee));
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterFeeDto | null;
    sortOptions?: SortFeeDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Fee[]> {
    const queryBuilder = this.feesRepository
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.student', 'student')
      .leftJoinAndSelect('fee.class', 'class');

    if (filterOptions?.studentName) {
      queryBuilder.andWhere('student.name ILIKE :studentName', {
        studentName: `%${filterOptions.studentName}%`,
      });
    }

    if (filterOptions?.className) {
      queryBuilder.andWhere('class.name ILIKE :className', {
        className: `%${filterOptions.className}%`,
      });
    }

    if (filterOptions?.status) {
      queryBuilder.andWhere('fee.status = :status', {
        status: filterOptions.status,
      });
    }

    if (filterOptions?.amountMin !== undefined) {
      queryBuilder.andWhere('fee.amount >= :amountMin', {
        amountMin: filterOptions.amountMin,
      });
    }

    if (filterOptions?.amountMax !== undefined) {
      queryBuilder.andWhere('fee.amount <= :amountMax', {
        amountMax: filterOptions.amountMax,
      });
    }

    if (filterOptions?.dueDateFrom) {
      queryBuilder.andWhere('fee.dueDate >= :dueDateFrom', {
        dueDateFrom: filterOptions.dueDateFrom,
      });
    }

    if (filterOptions?.dueDateTo) {
      queryBuilder.andWhere('fee.dueDate <= :dueDateTo', {
        dueDateTo: filterOptions.dueDateTo,
      });
    }

    if (filterOptions?.paidDateFrom) {
      queryBuilder.andWhere('fee.paidAt >= :paidDateFrom', {
        paidDateFrom: filterOptions.paidDateFrom,
      });
    }

    if (filterOptions?.paidDateTo) {
      queryBuilder.andWhere('fee.paidAt <= :paidDateTo', {
        paidDateTo: filterOptions.paidDateTo,
      });
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sortOption) => {
        queryBuilder.addOrderBy(
          `fee.${sortOption.orderBy}`,
          sortOption.order.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    } else {
      queryBuilder.addOrderBy('fee.createdAt', 'DESC');
      queryBuilder.addOrderBy('fee.id', 'ASC');
    }

    queryBuilder.skip((paginationOptions.page - 1) * paginationOptions.limit);
    queryBuilder.take(paginationOptions.limit);

    const fees = await queryBuilder.getMany();
    return fees.map((fee) => this.feeMapper.toDomain(fee));
  }

  async update(id: Fee['id'], data: Partial<Fee>): Promise<Fee | null> {
    const fee = await this.feesRepository.findOne({
      where: { id },
    });

    if (!fee) {
      return null;
    }

    const feeEntity = this.feeMapper.toPersistence(data);
    const updatedFee = await this.feesRepository.save({
      ...fee,
      ...feeEntity,
    });

    return this.feeMapper.toDomain(updatedFee);
  }

  async remove(id: Fee['id']): Promise<void> {
    await this.feesRepository.softDelete(id);
  }
}
