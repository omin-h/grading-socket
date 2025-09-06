import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUpload } from './upload.entity';
import { FileUploadService } from './upload.service';
import { FileUploadController } from './upload.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FileUpload])],
  providers: [FileUploadService],
  controllers: [FileUploadController],
})
export class FileUploadModule {}