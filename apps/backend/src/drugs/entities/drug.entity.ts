import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('drugs')
export class Drug {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  drugName: string;

  @Column()
  setId: string;

  @Column()
  slug: string;

  @Column()
  labeler: string;

  @Column({ nullable: true })
  genericName: string;

  @Column({ nullable: true })
  labelerName: string;

  @Column({ nullable: true })
  productType: string;

  @Column({ nullable: true })
  effectiveTime: string;

  @Column({ nullable: true })
  title: string;

  @Column('text', { nullable: true })
  indicationsAndUsage: string;

  @Column('text', { nullable: true })
  dosageAndAdministration: string;

  @Column('text', { nullable: true })
  dosageFormsAndStrengths: string;

  @Column('text', { nullable: true })
  contraindications: string;

  @Column('text', { nullable: true })
  warningsAndPrecautions: string;

  @Column('text', { nullable: true })
  adverseReactions: string;

  @Column('text', { nullable: true })
  clinicalPharmacology: string;

  @Column('text', { nullable: true })
  clinicalStudies: string;

  @Column('text', { nullable: true })
  mechanismOfAction: string;

  @Column('text', { nullable: true })
  boxedWarning: string;

  @Column('text', { nullable: true })
  highlights: string;

  @Column('text', { nullable: true })
  aiEnhancedTitle: string;

  @Column('text', { nullable: true })
  aiMetaDescription: string;

  @Column('text', { nullable: true })
  aiSummary: string;

  @Column('text', { nullable: true })
  aiFaq: string;

  @Column('text', { nullable: true })
  aiRelatedDrugs: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}