import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentGatewayCredentialsRepository } from '../../payment-gateway-credentials.repository';
import { PaymentGatewayCredentials } from 'src/payments/domain/payment-gateway-credentials';
import { PaymentGatewayCredentialsEntity } from '../entities/payment-gateway-credentials.entity';
import { PaymentGatewayCredentialsMapper } from '../mappers/payment-gateway-credentials.mapper';
import { EncryptionService } from 'src/payments/infrastructure/encryption/encryption.service';

@Injectable()
export class PaymentGatewayCredentialsRepositoryImpl
  implements PaymentGatewayCredentialsRepository
{
  constructor(
    @InjectRepository(PaymentGatewayCredentialsEntity)
    private readonly credentialsRepository: Repository<PaymentGatewayCredentialsEntity>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findByGatewayId(
    gatewayId: number,
  ): Promise<PaymentGatewayCredentials[]> {
    const entities = await this.credentialsRepository.find({
      where: { gatewayId },
      relations: ['gateway'],
    });
    return entities.map((entity) => this.decryptEntity(entity));
  }

  async findByGatewayIdAndEnvironment(
    gatewayId: number,
    environment: string,
  ): Promise<PaymentGatewayCredentials | null> {
    const entity = await this.credentialsRepository.findOne({
      where: {
        gatewayId,
        environment: environment as 'sandbox' | 'production',
      },
      relations: ['gateway'],
    });
    return entity ? this.decryptEntity(entity) : null;
  }

  async findActiveByGatewayId(
    gatewayId: number,
  ): Promise<PaymentGatewayCredentials | null> {
    const entity = await this.credentialsRepository.findOne({
      where: { gatewayId, isActive: true },
      relations: ['gateway'],
    });
    return entity ? this.decryptEntity(entity) : null;
  }

  async create(
    data: Partial<PaymentGatewayCredentials>,
  ): Promise<PaymentGatewayCredentials> {
    const entity = this.credentialsRepository.create(
      this.encryptData(
        PaymentGatewayCredentialsMapper.toPersistence(
          data as PaymentGatewayCredentials,
        ),
      ),
    );
    const savedEntity = await this.credentialsRepository.save(entity);
    return this.decryptEntity(savedEntity);
  }

  async update(
    id: number,
    data: Partial<PaymentGatewayCredentials>,
  ): Promise<PaymentGatewayCredentials> {
    const existingEntity = await this.credentialsRepository.findOne({
      where: { id },
    });
    if (!existingEntity) {
      throw new Error(`Payment gateway credentials with id ${id} not found`);
    }

    const updateData = this.encryptData(
      PaymentGatewayCredentialsMapper.toPersistence(
        data as PaymentGatewayCredentials,
      ),
    );
    await this.credentialsRepository.update(id, updateData);

    const updatedEntity = await this.credentialsRepository.findOne({
      where: { id },
      relations: ['gateway'],
    });
    return this.decryptEntity(updatedEntity!);
  }

  async delete(id: number): Promise<void> {
    await this.credentialsRepository.softDelete(id);
  }

  async toggleActive(id: number): Promise<PaymentGatewayCredentials> {
    const entity = await this.credentialsRepository.findOne({ where: { id } });
    if (!entity) {
      throw new Error(`Payment gateway credentials with id ${id} not found`);
    }

    entity.isActive = !entity.isActive;
    const updatedEntity = await this.credentialsRepository.save(entity);
    return this.decryptEntity(updatedEntity);
  }

  private encryptData(
    entity: Partial<PaymentGatewayCredentialsEntity>,
  ): Partial<PaymentGatewayCredentialsEntity> {
    const encrypted = { ...entity };

    if (entity.apiKey) {
      encrypted.apiKey = this.encryptionService.encrypt(entity.apiKey);
    }
    if (entity.secretKey) {
      encrypted.secretKey = this.encryptionService.encrypt(entity.secretKey);
    }
    if (entity.webhookSecret) {
      encrypted.webhookSecret = this.encryptionService.encrypt(
        entity.webhookSecret,
      );
    }

    return encrypted;
  }

  private decryptEntity(
    entity: PaymentGatewayCredentialsEntity,
  ): PaymentGatewayCredentials {
    const decrypted = PaymentGatewayCredentialsMapper.toDomain(entity);

    try {
      decrypted.apiKey = this.encryptionService.decrypt(entity.apiKey);
      decrypted.secretKey = this.encryptionService.decrypt(entity.secretKey);
      if (entity.webhookSecret) {
        decrypted.webhookSecret = this.encryptionService.decrypt(
          entity.webhookSecret,
        );
      }
    } catch (error) {
      // If decryption fails, return the entity without decrypted fields
      console.warn('Failed to decrypt payment gateway credentials:', error);
    }

    return decrypted;
  }
}
