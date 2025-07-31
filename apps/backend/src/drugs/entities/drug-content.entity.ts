import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Drug } from './drug.entity';

@Entity('drug_contents')
export class DrugContent {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string;

  @Column()
  @Exclude()
  drugId: string;

  @OneToOne(() => Drug, drug => drug.content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drugId' })
  drug: Drug;

  @Column('varchar', { nullable: true })
  genericName: string;

  @Column('varchar', { nullable: true })
  labelerName: string;

  @Column('varchar', { nullable: true })
  productType: string;

  @Column('varchar', { nullable: true })
  effectiveTime: string;

  @Column('varchar', { nullable: true })
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