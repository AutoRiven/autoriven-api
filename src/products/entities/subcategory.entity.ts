import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { Category } from './category.entity';

@Entity('subcategories')
export class Subcategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  nameEn: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  englishSlug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  allegroId: string;

  @Column({ nullable: true, unique: true })
  autoRivenId: number;

  @Column({ nullable: true })
  allegroUrl: string;

  @Column({ nullable: true })
  englishUrl: string;

  @Column({ default: 1 })
  level: number; // 1-4 for subcategory levels

  @Column({ default: 0 })
  productCount: number;

  @Column({ default: false })
  hasProducts: boolean;

  // Relationship to main category (Level 0)
  @ManyToOne(() => Category, category => category.subcategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  // Self-referencing relationship for subcategory hierarchy
  @ManyToOne(() => Subcategory, subcategory => subcategory.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Subcategory;

  @Column({ nullable: true })
  parentId: string;

  @OneToMany(() => Subcategory, subcategory => subcategory.parent)
  children: Subcategory[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
