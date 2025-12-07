import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartEntity } from './infrastructure/persistence/relational/entities/cart.entity';
import { CartItemEntity } from './infrastructure/persistence/relational/entities/cart-item.entity';
import { ClassesModule } from '../classes/classes.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartEntity, CartItemEntity]),
    forwardRef(() => ClassesModule),
    CurrencyModule,
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

