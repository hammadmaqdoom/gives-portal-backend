import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartEntity } from './infrastructure/persistence/relational/entities/cart.entity';
import { CartItemEntity } from './infrastructure/persistence/relational/entities/cart-item.entity';
import { ClassesService } from '../classes/classes.service';

export interface CartItem {
  classId: number;
  className: string;
  price: number;
  currency: string;
  thumbnailUrl?: string | null;
}

export interface Cart {
  id?: number;
  userId?: number | null;
  sessionId?: string | null;
  items: CartItem[];
  total: number;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepo: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepo: Repository<CartItemEntity>,
    private readonly classesService: ClassesService,
  ) {}

  /**
   * Get or create cart for user or session
   */
  async getCart(
    userId?: number,
    sessionId?: string,
    currency: string = 'USD',
  ): Promise<Cart> {
    let cartEntity: CartEntity | null = null;

    if (userId) {
      cartEntity = await this.cartRepo.findOne({
        where: { userId, isActive: true },
        relations: ['items'],
      });
    } else if (sessionId) {
      cartEntity = await this.cartRepo.findOne({
        where: { sessionId, isActive: true },
        relations: ['items'],
      });
    }

    if (!cartEntity) {
      // Create new cart
      cartEntity = this.cartRepo.create({
        userId: userId || null,
        sessionId: sessionId || null,
        currency,
        isActive: true,
        items: [],
      });
      cartEntity = await this.cartRepo.save(cartEntity);
    }

    // Update currency if different
    if (cartEntity.currency !== currency) {
      cartEntity.currency = currency;
      await this.cartRepo.save(cartEntity);
    }

    return this.mapToCart(cartEntity);
  }

  /**
   * Add course to cart
   */
  async addToCart(
    classId: number,
    userId?: number,
    sessionId?: string,
    currency: string = 'USD',
  ): Promise<Cart> {
    // Get or create cart
    const cart = await this.getCart(userId, sessionId, currency);
    const cartEntity = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    if (!cartEntity) {
      throw new Error('Cart not found');
    }

    // Check if item already exists
    const existingItem = cartEntity.items?.find(
      (item) => item.classId === classId,
    );

    if (existingItem) {
      // Item already in cart
      return this.mapToCart(cartEntity);
    }

    // Get class details
    const classEntity = await this.classesService.findById(classId);
    if (!classEntity) {
      throw new Error('Class not found');
    }

    if (!(classEntity as any).isPublicForSale) {
      throw new Error('Course not available for public sale');
    }

    // Get price for currency
    const price = this.classesService.getPriceForCurrency(classEntity, currency);

    // Create cart item
    const cartItem = this.cartItemRepo.create({
      cartId: cartEntity.id!,
      classId,
      price,
      currency,
    });

    await this.cartItemRepo.save(cartItem);

    // Refresh cart
    const updatedCart = await this.cartRepo.findOne({
      where: { id: cartEntity.id },
      relations: ['items'],
    });

    return this.mapToCart(updatedCart!);
  }

  /**
   * Remove course from cart
   */
  async removeFromCart(
    classId: number,
    userId?: number,
    sessionId?: string,
  ): Promise<Cart> {
    const cart = await this.getCart(userId, sessionId);
    const cartEntity = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    if (!cartEntity) {
      throw new Error('Cart not found');
    }

    // Find and remove item
    const itemToRemove = cartEntity.items?.find(
      (item) => item.classId === classId,
    );

    if (itemToRemove) {
      await this.cartItemRepo.remove(itemToRemove);
    }

    // Refresh cart
    const updatedCart = await this.cartRepo.findOne({
      where: { id: cartEntity.id },
      relations: ['items'],
    });

    return this.mapToCart(updatedCart!);
  }

  /**
   * Clear cart
   */
  async clearCart(userId?: number, sessionId?: string): Promise<void> {
    const cart = await this.getCart(userId, sessionId);
    const cartEntity = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    if (cartEntity) {
      // Remove all items
      if (cartEntity.items && cartEntity.items.length > 0) {
        await this.cartItemRepo.remove(cartEntity.items);
      }
      // Deactivate cart
      cartEntity.isActive = false;
      await this.cartRepo.save(cartEntity);
    }
  }

  /**
   * Map entity to domain model
   */
  private async mapToCart(cartEntity: CartEntity): Promise<Cart> {
    const items: CartItem[] = [];

    if (cartEntity.items && cartEntity.items.length > 0) {
      for (const item of cartEntity.items) {
        const classEntity = await this.classesService.findById(item.classId);
        if (classEntity) {
          items.push({
            classId: item.classId,
            className: classEntity.name,
            price: Number(item.price),
            currency: item.currency,
            thumbnailUrl: (classEntity as any).thumbnailUrl,
          });
        }
      }
    }

    const total = items.reduce((sum, item) => sum + item.price, 0);

    return {
      id: cartEntity.id,
      userId: cartEntity.userId || undefined,
      sessionId: cartEntity.sessionId || undefined,
      items,
      total: Number(total.toFixed(2)),
      currency: cartEntity.currency,
      createdAt: cartEntity.createdAt,
      updatedAt: cartEntity.updatedAt,
    };
  }
}

