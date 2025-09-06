import { Controller, Post, UploadedFiles, UseInterceptors,} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileUploadService } from './upload.service';
import { extname } from 'path';
import { FileUpload, FileType } from './upload.entity';


@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('bulk')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'marking', maxCount: 20 },
        { name: 'answer', maxCount: 20 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + extname(file.originalname));
          },
        }),
      },
    ),
  )
  async uploadBulk(
    @UploadedFiles() files: { marking?: Express.Multer.File[]; answer?: Express.Multer.File[] },
  ) {
    const markingFiles = files.marking || [];
    const answerFiles = files.answer || [];
    const savedFiles: FileUpload[] = []; // <-- Explicitly type the array

    for (const file of markingFiles) {
      const saved = await this.fileUploadService.saveFile(file, FileType.MARKING);
      savedFiles.push(saved);
    }
    for (const file of answerFiles) {
      const saved = await this.fileUploadService.saveFile(file, FileType.ANSWER);
      savedFiles.push(saved);
    }
    return savedFiles;
  }
}