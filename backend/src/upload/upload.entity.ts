import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum FileStatus {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  FAILED = 'FAILED',
}

export enum FileType {
  MARKING = 'MARKING',
  ANSWER = 'ANSWER',
}

export enum AIStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

@Entity()
export class FileUpload {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  originalName: string;

  @Column()
  filename: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @Column({ type: 'text', default: FileStatus.UPLOADING }) 
  status: FileStatus;

  @Column({ type: 'text' }) 
  fileType: FileType;

  @Column({ type: 'text', nullable: true })
  aiStatus: AIStatus;

  @Column({ type: 'text', nullable: true })
  aiResult: string; // Store as JSON string or plain text

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}