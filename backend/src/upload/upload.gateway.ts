import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { FileUpload } from './upload.entity';

@WebSocketGateway({ cors: true })
export class FileUploadGateway {
  @WebSocketServer()
  server: Server;

  emitFileStatus(file: FileUpload) {
    console.log('Emitting fileStatus event:', file);
    this.server.emit('fileStatus', file);
  }
}