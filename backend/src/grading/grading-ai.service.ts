import { Injectable } from '@nestjs/common';
import { FileUpload, AIStatus} from '../upload/upload.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FileUploadGateway } from '../upload/upload.gateway';
import fetch from 'node-fetch';
import FormData from 'form-data';
import * as fs from 'fs';

@Injectable()
export class GradingAIService {
  private queue: Array<{ answerFile: FileUpload; markingFile: FileUpload }> = [];
  private processing = false;

  constructor(
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    private readonly gateway: FileUploadGateway,
  ) {}

  async gradeAnswer(answerFile: FileUpload, markingFile: FileUpload) {
    this.queue.push({ answerFile, markingFile });
    this.processNext();
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    const item = this.queue.shift();
    if (!item) {
      this.processing = false;
      return;
    }
    const { answerFile, markingFile } = item;

    try {
      console.log('GradingAIService.gradeAnswer called for', answerFile.originalName);
      answerFile.aiStatus = AIStatus.PROCESSING;
      await this.fileRepo.save(answerFile);
      console.log('Set aiStatus to PROCESSING for', answerFile.originalName);
      this.gateway.server.emit('aiStatus', { id: answerFile.id, aiStatus: AIStatus.PROCESSING });

      const form = new FormData();
      form.append('image', fs.createReadStream(answerFile.path));
      form.append('pdf', fs.createReadStream(markingFile.path));

      console.log('Sending files to AI for', answerFile.originalName);
      const response = await fetch('http://95.217.49.235:8300/upload', {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });
      console.log('Received response from AI for', answerFile.originalName);

      let resultText = await response.text();
      let result;
      try {
        result = JSON.parse(resultText);
      } catch {
        result = resultText;
      }

      answerFile.aiStatus = AIStatus.DONE;
      answerFile.aiResult = result;
      await this.fileRepo.save(answerFile);
      this.gateway.server.emit('aiStatus', { id: answerFile.id, aiStatus: AIStatus.DONE });
      this.gateway.server.emit('aiResult', { id: answerFile.id, aiResult: result });
    } catch (e) {
      console.error('Error sending to AI:', e);
      answerFile.aiStatus = AIStatus.FAILED;
      await this.fileRepo.save(answerFile);
      this.gateway.server.emit('aiStatus', { id: answerFile.id, aiStatus: AIStatus.FAILED });
    }

    markingFile.used = true;
    await this.fileRepo.save(markingFile);

    this.processing = false;
    this.processNext();
  }
}