import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import { DrugContent } from './drug-content.entity';
import { AiSeoDrugContent } from './ai-seo-drug-content.entity';

@Entity('drugs')
export class Drug {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string;

  @Column()
  drugName: string;

  @Column()
  @Exclude()
  setId: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  labeler: string;

  @OneToOne(() => DrugContent, content => content.drug, { cascade: true })
  content: DrugContent;

  @OneToMany(() => AiSeoDrugContent, aiSeoContent => aiSeoContent.drug, { cascade: true })
  aiSeoContents: AiSeoDrugContent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}