import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileUpload, FileStatus, FileType } from './upload.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
  ) {}

  async saveFile(file: Express.Multer.File, fileType: FileType) {
    // 1. Create record with status UPLOADING
    const fileRecord = this.fileRepo.create({
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      status: FileStatus.UPLOADING,
      fileType,
    });
    await this.fileRepo.save(fileRecord);

    // 2. Update status to UPLOADED
    fileRecord.status = FileStatus.UPLOADED;
    await this.fileRepo.save(fileRecord);

    return fileRecord;
  }
}