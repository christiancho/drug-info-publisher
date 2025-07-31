import 'reflect-metadata';
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

  @Column('jsonb', { nullable: true })
  indicationsAndUsage: any;

  @Column('jsonb', { nullable: true })
  dosageAndAdministration: any;

  @Column('jsonb', { nullable: true })
  dosageFormsAndStrengths: any;

  @Column('jsonb', { nullable: true })
  contraindications: any;

  @Column('jsonb', { nullable: true })
  warningsAndPrecautions: any;

  @Column('jsonb', { nullable: true })
  adverseReactions: any;

  @Column('jsonb', { nullable: true })
  clinicalPharmacology: any;

  @Column('jsonb', { nullable: true })
  clinicalStudies: any;

  @Column('jsonb', { nullable: true })
  mechanismOfAction: any;

  @Column('jsonb', { nullable: true })
  boxedWarning: any;

  @Column('jsonb', { nullable: true })
  highlights: any;

  @Column('jsonb', { nullable: true })
  description: any;

  @Column('jsonb', { nullable: true })
  howSupplied: any;

  @Column('jsonb', { nullable: true })
  instructionsForUse: any;

  @Column('jsonb', { nullable: true })
  nonclinicalToxicology: any;

  @Column('jsonb', { nullable: true })
  useInSpecificPopulations: any;

  @Column('jsonb', { nullable: true })
  drugInteractions: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}