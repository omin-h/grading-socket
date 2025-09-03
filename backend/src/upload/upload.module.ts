import { Module } from '@nestjs/common';

@Module({
    providers: [],
    exports: [],
})
export class UploadModule {
    // Generates a random string
    static generateRandomString(length: number = 16): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}