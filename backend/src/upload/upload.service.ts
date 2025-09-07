import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileUpload, FileStatus, FileType } from './upload.entity';
import { Repository } from 'typeorm';
import { FileUploadGateway } from './upload.gateway';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    private readonly gateway: FileUploadGateway,
  ) {}

  async saveFile(file: Express.Multer.File, fileType: FileType) {
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
    this.gateway.emitFileStatus(fileRecord); // Emit UPLOADING

    fileRecord.status = FileStatus.UPLOADED;
    await this.fileRepo.save(fileRecord);
    this.gateway.emitFileStatus(fileRecord); // Emit UPLOADED

    return fileRecord;
  }
}