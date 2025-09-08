import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUpload } from './upload.entity';
import { FileUploadService } from './upload.service';
import { FileUploadController } from './upload.controller';
import { FileUploadGateway } from './upload.gateway';
import { GradingModule } from '../grading/grading.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUpload]),
    forwardRef(() => GradingModule), // <-- Use forwardRef here
  ],
  providers: [FileUploadService, FileUploadGateway],
  controllers: [FileUploadController],
  exports: [FileUploadGateway],
})
export class FileUploadModule {}