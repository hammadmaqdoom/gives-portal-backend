import { InvoiceItem } from '../../../../domain/invoice-item';
import { InvoiceItemEntity } from '../entities/invoice-item.entity';

export class InvoiceItemMapper {
  static toDomain(raw: InvoiceItemEntity): InvoiceItem {
    const domainEntity = new InvoiceItem();
    domainEntity.id = raw.id;
    domainEntity.invoiceId = raw.invoice?.id || 0;
    domainEntity.description = raw.description;
    domainEntity.quantity = raw.quantity;
    domainEntity.unitPrice = Number(raw.unitPrice);
    domainEntity.total = Number(raw.total);
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: InvoiceItem): Partial<InvoiceItemEntity> {
    const persistenceEntity = new InvoiceItemEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.quantity = domainEntity.quantity;
    persistenceEntity.unitPrice = domainEntity.unitPrice;
    persistenceEntity.total = domainEntity.total;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
