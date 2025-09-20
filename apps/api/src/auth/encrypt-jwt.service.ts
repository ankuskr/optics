import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AESDecryption,AESEncryption, } from '../common/encryptionService';

@Injectable()
export class EncryptJwtService {
    constructor(private readonly jwtService: JwtService) {}

    sign(payload: any): string {
        const payloadString = JSON.stringify(payload);
        const encryptedPayload = AESEncryption(payloadString, process.env.JWT_SECRETKEY);
        return this.jwtService.sign({ encrypted: encryptedPayload });
    }


    decode(token: string): null | Record<string, any> {
        const decoded: any = this.jwtService.decode(token);
        if (decoded?.encrypted) {
            const decrypted = AESDecryption(decoded.encrypted, process.env.JWT_SECRETKEY);
            return JSON.parse(decrypted);
        } else if (decoded) {
            return typeof decoded === 'string' ? JSON.parse(decoded) : decoded;
        }
        return null;
    }
    
}