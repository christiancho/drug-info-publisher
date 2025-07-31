import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Drug } from './drug.entity';

@Entity('ai_seo_drug_contents')
@Index('IDX_ai_seo_drug_content_active', ['drugId', 'active'], { 
  unique: true, 
  where: 'active = true' 
})
export class AiSeoDrugContent {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string;

  @Column()
  @Exclude()
  drugId: string;

  @ManyToOne(() => Drug, drug => drug.aiSeoContents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drugId' })
  drug: Drug;

  @Column('varchar')
  metaDescription: string;

  @Column('varchar')
  title: string;

  @Column('boolean', { default: false })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}