// grading.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradingAIService } from './grading-ai.service';
import { FileUpload } from '../upload/upload.entity';
import { FileUploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUpload]),
    forwardRef(() => FileUploadModule), // <-- Use forwardRef here
  ],
  providers: [GradingAIService],
  exports: [GradingAIService],
})
export class GradingModule {}