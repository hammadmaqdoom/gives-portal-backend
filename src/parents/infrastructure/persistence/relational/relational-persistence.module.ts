import { Module } from '@nestjs/common';
import { ParentRepository } from '../parent.repository';
import { ParentsRelationalRepository } from './repositories/parent.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentEntity } from './entities/parent.entity';
import { ParentMapper } from './mappers/parent.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([ParentEntity])],
  providers: [
    {
      provide: ParentRepository,
      useClass: ParentsRelationalRepository,
    },
    ParentMapper,
  ],
  exports: [ParentRepository],
})
export class RelationalParentPersistenceModule {}
