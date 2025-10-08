import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  nameEn: string;

  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  descriptionHtml: string;

  @Column({ nullable: true })
  allegroId: string;

  @Column({ type: 'integer', unique: true, nullable: true })
  autoRivenId: number;

  @Column({ nullable: true })
  allegroUrl: string;

  @Column({ nullable: true })
  englishSlug: string;

  @Column({ nullable: true })
  englishUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  year: string;

  @Column({ nullable: true })
  partNumber: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  condition: string;

  @Column({ nullable: true })
  ean: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number;

  @Column({ type: 'integer', default: 0 })
  reviewCount: number;

  @Column({ default: false })
  freeDelivery: boolean;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column('simple-array', { nullable: true })
  galleryImages: string[];

  @Column({ type: 'json', nullable: true })
  specifications: Record<string, any>;

  @Column({ nullable: true })
  sellerName: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  sellerRating: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  inStock: boolean;

  @ManyToOne(() => Category, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Subcategory, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subcategoryId' })
  subcategory: Subcategory;

  @Column({ nullable: true })
  subcategoryId: string;

  // Relationships - commented out until these entities are created
  // @OneToMany('OrderItem', 'product')
  // orderItems: any[];

  // @OneToMany('Review', 'product')
  // reviews: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastScrapedAt: Date;
}
