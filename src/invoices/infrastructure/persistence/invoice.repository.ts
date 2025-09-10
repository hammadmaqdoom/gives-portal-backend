import { Injectable } from '@nestjs/common';
import { Invoice } from '../../domain/invoice';
import { FilterInvoiceDto, SortInvoiceDto } from '../../dto/query-invoice.dto';

export interface InvoiceRepository {
  create(data: Partial<Invoice>): Promise<Invoice>;
  findById(id: Invoice['id']): Promise<Invoice | null>;
  findManyWithPagination({
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
  }): Promise<Invoice[]>;
  update(id: Invoice['id'], payload: Partial<Invoice>): Promise<Invoice | null>;
  remove(id: Invoice['id']): Promise<void>;
  findByStudent(studentId: number): Promise<Invoice[]>;
  findByParent(parentId: number): Promise<Invoice[]>;
  findByStatus(status: string): Promise<Invoice[]>;
  findOverdue(): Promise<Invoice[]>;
  generateInvoiceNumber(): Promise<string>;
}
