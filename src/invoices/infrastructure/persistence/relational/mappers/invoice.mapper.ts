import { Invoice } from '../../../../domain/invoice';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceItemMapper } from './invoice-item.mapper';

export class InvoiceMapper {
  static toDomain(raw: InvoiceEntity): Invoice {
    const domainEntity = new Invoice();
    domainEntity.id = raw.id;
    domainEntity.invoiceNumber = raw.invoiceNumber;
    domainEntity.studentId = raw.student?.id || 0;
    domainEntity.studentName = raw.student?.name || 'Unknown Student';
    domainEntity.parentId = raw.parent?.id;
    domainEntity.parentName = raw.parent?.fullName;
    domainEntity.amount = Number(raw.amount);
    domainEntity.currency = raw.currency;
    domainEntity.status = raw.status;
    domainEntity.dueDate = raw.dueDate;
    domainEntity.generatedDate = raw.generatedDate;
    domainEntity.paidDate = raw.paidDate;
    domainEntity.paymentMethod = raw.paymentMethod;
    domainEntity.transactionId = raw.transactionId;
    domainEntity.description = raw.description;
    domainEntity.notes = raw.notes;
    domainEntity.paymentProofUrl = raw.paymentProofUrl;
    domainEntity.originalPrice = raw.originalPrice
      ? Number(raw.originalPrice)
      : undefined;
    domainEntity.discountAmount = raw.discountAmount
      ? Number(raw.discountAmount)
      : undefined;
    domainEntity.discountType = raw.discountType;
    domainEntity.classId = raw.classId;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    domainEntity.items =
      raw.items?.map((item) => InvoiceItemMapper.toDomain(item)) || [];
    return domainEntity;
  }

  static toPersistence(domainEntity: Invoice): Partial<InvoiceEntity> {
    const persistenceEntity = new InvoiceEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.invoiceNumber = domainEntity.invoiceNumber;

    // Set foreign key relationships
    if (domainEntity.studentId) {
      persistenceEntity.student = { id: domainEntity.studentId } as any;
    }
    if (domainEntity.parentId) {
      persistenceEntity.parent = { id: domainEntity.parentId } as any;
    }

    persistenceEntity.amount = domainEntity.amount;
    persistenceEntity.currency = domainEntity.currency;
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.dueDate = domainEntity.dueDate;
    persistenceEntity.generatedDate = domainEntity.generatedDate;
    persistenceEntity.paidDate = domainEntity.paidDate;
    persistenceEntity.paymentMethod = domainEntity.paymentMethod;
    persistenceEntity.transactionId = domainEntity.transactionId;
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.notes = domainEntity.notes;
    persistenceEntity.paymentProofUrl = domainEntity.paymentProofUrl;
    persistenceEntity.originalPrice = domainEntity.originalPrice;
    persistenceEntity.discountAmount = domainEntity.discountAmount;
    persistenceEntity.discountType = domainEntity.discountType;
    persistenceEntity.classId = domainEntity.classId;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;
    persistenceEntity.items =
      domainEntity.items?.map(
        (item) => InvoiceItemMapper.toPersistence(item) as any,
      ) || [];
    return persistenceEntity;
  }
}
