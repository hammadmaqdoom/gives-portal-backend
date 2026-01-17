import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, IsNull } from 'typeorm';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceItemEntity } from '../entities/invoice-item.entity';
import { InvoiceRepository } from '../../invoice.repository';
import { Invoice } from '../../../../domain/invoice';
import {
  FilterInvoiceDto,
  SortInvoiceDto,
} from '../../../../dto/query-invoice.dto';
import { InvoiceMapper } from '../mappers/invoice.mapper';
import { InvoiceItemMapper } from '../mappers/invoice-item.mapper';

@Injectable()
export class InvoiceRepositoryImpl implements InvoiceRepository {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(InvoiceItemEntity)
    private readonly invoiceItemRepository: Repository<InvoiceItemEntity>,
  ) {}

  async create(data: Partial<Invoice>): Promise<Invoice> {
    const persistenceModel = InvoiceMapper.toPersistence(data as Invoice);
    
    // Create invoice entity first (without items)
    const invoiceEntity = this.invoiceRepository.create({
      ...persistenceModel,
      items: undefined, // Remove items temporarily
    });
    
    // Save invoice first to get the ID
    const savedInvoice = await this.invoiceRepository.save(invoiceEntity);
    
    // Now create and save items if they exist
    if (data.items && data.items.length > 0) {
      const itemEntities = data.items.map((item) => {
        const itemEntity = this.invoiceItemRepository.create({
          invoice: savedInvoice,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        });
        return itemEntity;
      });
      
      await this.invoiceItemRepository.save(itemEntities);
    }
    
    // Fetch the complete invoice with items
    const completeInvoice = await this.invoiceRepository.findOne({
      where: { id: savedInvoice.id },
      relations: ['student', 'parent', 'items'],
    });
    
    return InvoiceMapper.toDomain(completeInvoice!);
  }

  async findById(id: Invoice['id']): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['student', 'parent', 'items'],
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
      relations: ['student', 'parent', 'items'],
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
    console.log(
      `🔍 InvoiceRepository.findByStudent called with studentId: ${studentId}`,
    );

    const entities = await this.invoiceRepository.find({
      where: { 
        student: { id: studentId },
        deletedAt: IsNull(), // Exclude soft-deleted invoices
      },
      relations: ['student', 'parent', 'items'],
      order: { createdAt: 'DESC' },
    });

    console.log(`🔍 InvoiceRepository.findByStudent raw entities:`, entities);
    console.log(
      `🔍 InvoiceRepository.findByStudent found ${entities.length} invoices`,
    );

    const result = entities.map((entity) => InvoiceMapper.toDomain(entity));
    console.log(`🔍 InvoiceRepository.findByStudent mapped result:`, result);

    return result;
  }

  async findByParent(parentId: number): Promise<Invoice[]> {
    const entities = await this.invoiceRepository.find({
      where: { parent: { id: parentId } },
      relations: ['student', 'parent', 'items'],
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async findByStatus(status: string): Promise<Invoice[]> {
    const entities = await this.invoiceRepository.find({
      where: { status: status as any },
      relations: ['student', 'parent', 'items'],
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async findOverdue(): Promise<Invoice[]> {
    const entities = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.student', 'student')
      .leftJoinAndSelect('invoice.parent', 'parent')
      .leftJoinAndSelect('invoice.items', 'items')
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

    // Use a transaction with row-level locking to prevent race conditions
    // This ensures that only one process can generate an invoice number at a time
    const queryRunner = this.invoiceRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the maximum invoice number INCLUDING soft-deleted ones
      // This is important because soft-deleted invoices still hold their invoice numbers
      // and we need to avoid duplicate key violations
      // Lock the table to prevent concurrent access during number generation
      const result = await queryRunner.manager.query(
        `SELECT "invoiceNumber"
         FROM invoice
         WHERE "invoiceNumber" LIKE $1
         ORDER BY CAST(SUBSTRING("invoiceNumber" FROM '-(\\d+)$') AS INTEGER) DESC
         LIMIT 1
         FOR UPDATE`,
        [`${prefix}-%`]
      );

      let nextNumber = 1;
      if (result && result.length > 0 && result[0].invoiceNumber) {
        // Extract the numeric part from the invoice number (e.g., "INV-2026-0001" -> 1)
        const lastInvoiceNumber = result[0].invoiceNumber;
        const numericPart = lastInvoiceNumber.split('-').pop();
        const lastNumber = parseInt(numericPart || '0', 10);
        nextNumber = lastNumber + 1;
      }

      // Generate the invoice number
      const invoiceNumber = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
      
      await queryRunner.commitTransaction();
      return invoiceNumber;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
