import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileUpload, FileStatus, FileType, AIStatus } from './upload.entity';
import { Repository } from 'typeorm';
import { FileUploadGateway } from './upload.gateway';
import { GradingAIService } from '../grading/grading-ai.service';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    private readonly gateway: FileUploadGateway,
    private readonly gradingAIService: GradingAIService, // Inject GradingAIService
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
      aiStatus: fileType === FileType.ANSWER ? AIStatus.PENDING : undefined,
    });
    await this.fileRepo.save(fileRecord);
    this.gateway.emitFileStatus(fileRecord); // Emit UPLOADING

    fileRecord.status = FileStatus.UPLOADED;
    await this.fileRepo.save(fileRecord);
    this.gateway.emitFileStatus(fileRecord); // Emit UPLOADED

    // If this is an answer file, trigger grading
    if (fileType === FileType.ANSWER) {
      // Find the latest marking scheme file
      const markingFile = await this.fileRepo.findOne({
        where: { fileType: FileType.MARKING },
        order: { createdAt: 'DESC' },
      });
      if (markingFile) {
        this.gradingAIService.gradeAnswer(fileRecord, markingFile).catch(console.error);
      }
    }

    return fileRecord;
  }
}