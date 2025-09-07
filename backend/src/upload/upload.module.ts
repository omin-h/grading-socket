import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUpload } from './upload.entity';
import { FileUploadService } from './upload.service';
import { FileUploadController } from './upload.controller';
import { FileUploadGateway } from './upload.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([FileUpload])],
  providers: [FileUploadService, FileUploadGateway],
  controllers: [FileUploadController],
})
export class FileUploadModule {}