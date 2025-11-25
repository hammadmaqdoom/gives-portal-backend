import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentGatewayRepository } from '../../payment-gateway.repository';
import { PaymentGateway } from 'src/payments/domain/payment-gateway';
import { PaymentGatewayEntity } from '../entities/payment-gateway.entity';
import { PaymentGatewayMapper } from '../mappers/payment-gateway.mapper';

@Injectable()
export class PaymentGatewayRepositoryImpl implements PaymentGatewayRepository {
  constructor(
    @InjectRepository(PaymentGatewayEntity)
    private readonly paymentGatewayRepository: Repository<PaymentGatewayEntity>,
  ) {}

  async findById(id: number): Promise<PaymentGateway | null> {
    const entity = await this.paymentGatewayRepository.findOne({
      where: { id },
      relations: ['credentials'],
    });
    return entity ? PaymentGatewayMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<PaymentGateway | null> {
    const entity = await this.paymentGatewayRepository.findOne({
      where: { name },
      relations: ['credentials'],
    });
    return entity ? PaymentGatewayMapper.toDomain(entity) : null;
  }

  async findActive(): Promise<PaymentGateway[]> {
    const entities = await this.paymentGatewayRepository.find({
      where: { isActive: true },
      relations: ['credentials'],
      order: { sortOrder: 'ASC' },
    });
    return entities.map(PaymentGatewayMapper.toDomain);
  }

  async findAll(): Promise<PaymentGateway[]> {
    const entities = await this.paymentGatewayRepository.find({
      relations: ['credentials'],
      order: { sortOrder: 'ASC' },
    });
    return entities.map(PaymentGatewayMapper.toDomain);
  }

  async create(data: Partial<PaymentGateway>): Promise<PaymentGateway> {
    const entity = this.paymentGatewayRepository.create(
      PaymentGatewayMapper.toPersistence(data as PaymentGateway),
    );
    const savedEntity = await this.paymentGatewayRepository.save(entity);
    return PaymentGatewayMapper.toDomain(savedEntity as PaymentGatewayEntity);
  }

  async update(
    id: number,
    data: Partial<PaymentGateway>,
  ): Promise<PaymentGateway> {
    await this.paymentGatewayRepository.update(id, data);
    const updatedEntity = await this.paymentGatewayRepository.findOne({
      where: { id },
      relations: ['credentials'],
    });
    return PaymentGatewayMapper.toDomain(updatedEntity!);
  }

  async delete(id: number): Promise<void> {
    await this.paymentGatewayRepository.softDelete(id);
  }

  async setDefault(id: number): Promise<void> {
    // First, unset all other gateways as default
    await this.paymentGatewayRepository.update(
      { isDefault: true },
      { isDefault: false },
    );
    // Then set the specified gateway as default
    await this.paymentGatewayRepository.update(id, { isDefault: true });
  }

  async toggleActive(id: number): Promise<PaymentGateway> {
    const entity = await this.paymentGatewayRepository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new Error(`Payment gateway with id ${id} not found`);
    }

    entity.isActive = !entity.isActive;
    const updatedEntity = await this.paymentGatewayRepository.save(entity);
    return PaymentGatewayMapper.toDomain(updatedEntity);
  }
}
