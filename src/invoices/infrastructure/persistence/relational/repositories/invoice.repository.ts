import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceRepository } from '../../invoice.repository';
import { Invoice } from '../../../../domain/invoice';
import {
  FilterInvoiceDto,
  SortInvoiceDto,
} from '../../../../dto/query-invoice.dto';
import { InvoiceMapper } from '../mappers/invoice.mapper';

@Injectable()
export class InvoiceRepositoryImpl implements InvoiceRepository {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
  ) {}

  async create(data: Partial<Invoice>): Promise<Invoice> {
    const persistenceModel = InvoiceMapper.toPersistence(data as Invoice);
    const newEntity = await this.invoiceRepository.save(
      this.invoiceRepository.create(persistenceModel),
    );
    return InvoiceMapper.toDomain(newEntity);
  }

  async findById(id: Invoice['id']): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['student', 'parent'],
    });

    return entity ? InvoiceMapper.toDomain(entity) : null;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterInvoiceDto | null;
    sortOptions?: SortInvoiceDto[] | null;
    paginationOptions: {
      page: number;
      limit: number;
    };
  }): Promise<Invoice[]> {
    const queryBuilder = this.createSelectQueryBuilder('invoice');

    this.addFilters(queryBuilder, filterOptions);
    this.addSorting(queryBuilder, sortOptions);
    this.addPagination(queryBuilder, paginationOptions);

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async update(
    id: Invoice['id'],
    payload: Partial<Invoice>,
  ): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['student', 'parent'],
    });

    if (!entity) {
      return null;
    }

    Object.assign(entity, InvoiceMapper.toPersistence(payload as Invoice));

    const updatedEntity = await this.invoiceRepository.save(entity);
    return InvoiceMapper.toDomain(updatedEntity);
  }

  async remove(id: Invoice['id']): Promise<void> {
    await this.invoiceRepository.softDelete(id);
  }

  async findByStudent(studentId: number): Promise<Invoice[]> {
    const entities = await this.invoiceRepository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'parent'],
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async findByParent(parentId: number): Promise<Invoice[]> {
    const entities = await this.invoiceRepository.find({
      where: { parent: { id: parentId } },
      relations: ['student', 'parent'],
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async findByStatus(status: string): Promise<Invoice[]> {
    const entities = await this.invoiceRepository.find({
      where: { status: status as any },
      relations: ['student', 'parent'],
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async findOverdue(): Promise<Invoice[]> {
    const entities = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.student', 'student')
      .leftJoinAndSelect('invoice.parent', 'parent')
      .where('invoice.dueDate < :today', { today: new Date() })
      .andWhere('invoice.status IN (:...statuses)', {
        statuses: ['sent', 'draft'],
      })
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}`;

    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.invoiceNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(
        lastInvoice.invoiceNumber.split('-').pop() || '0',
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  private createSelectQueryBuilder(
    alias: string,
  ): SelectQueryBuilder<InvoiceEntity> {
    return this.invoiceRepository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.student`, 'student')
      .leftJoinAndSelect(`${alias}.parent`, 'parent')
      .leftJoinAndSelect(`${alias}.items`, 'items');
  }

  private addFilters(
    queryBuilder: SelectQueryBuilder<InvoiceEntity>,
    filterOptions?: FilterInvoiceDto | null,
  ): void {
    if (!filterOptions) {
      return;
    }

    if (filterOptions.search) {
      queryBuilder.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR student.name ILIKE :search OR parent.fullName ILIKE :search)',
        { search: `%${filterOptions.search}%` },
      );
    }

    if (filterOptions.studentId) {
      queryBuilder.andWhere('student.id = :studentId', {
        studentId: filterOptions.studentId,
      });
    }

    if (filterOptions.parentId) {
      queryBuilder.andWhere('parent.id = :parentId', {
        parentId: filterOptions.parentId,
      });
    }

    if (filterOptions.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: filterOptions.status,
      });
    }

    if (filterOptions.currency) {
      queryBuilder.andWhere('invoice.currency = :currency', {
        currency: filterOptions.currency,
      });
    }

    if (filterOptions.startDate) {
      queryBuilder.andWhere('invoice.dueDate >= :startDate', {
        startDate: filterOptions.startDate,
      });
    }

    if (filterOptions.endDate) {
      queryBuilder.andWhere('invoice.dueDate <= :endDate', {
        endDate: filterOptions.endDate,
      });
    }
  }

  private addSorting(
    queryBuilder: SelectQueryBuilder<InvoiceEntity>,
    sortOptions?: SortInvoiceDto[] | null,
  ): void {
    if (!sortOptions || sortOptions.length === 0) {
      queryBuilder.orderBy('invoice.createdAt', 'DESC');
      return;
    }

    // Valid sort keys for invoice entity
    const validSortKeys = [
      'id',
      'invoiceNumber',
      'amount',
      'currency',
      'status',
      'dueDate',
      'paidDate',
      'createdAt',
      'updatedAt',
    ];

    sortOptions.forEach((sort, index) => {
      if (!sort.key || !validSortKeys.includes(sort.key)) {
        return; // Skip invalid sort keys
      }

      const order = sort.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      if (index === 0) {
        queryBuilder.orderBy(`invoice.${sort.key}`, order);
      } else {
        queryBuilder.addOrderBy(`invoice.${sort.key}`, order);
      }
    });

    // If no valid sort options were applied, add default sorting
    if (
      !queryBuilder.expressionMap.orderBys ||
      Object.keys(queryBuilder.expressionMap.orderBys).length === 0
    ) {
      queryBuilder.orderBy('invoice.createdAt', 'DESC');
    }
  }

  private addPagination(
    queryBuilder: SelectQueryBuilder<InvoiceEntity>,
    paginationOptions: { page: number; limit: number },
  ): void {
    const { page, limit } = paginationOptions;
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
  }
}
