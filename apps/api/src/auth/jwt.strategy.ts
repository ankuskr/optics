import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { Injectable, HttpException, HttpStatus, HttpCode, NotFoundException } from '@nestjs/common';
import { encryptedPayloadType, LoggedInUser } from './interfaces/payload.interface';
import { User } from '../user/entities/user.entity';
import { AESDecryption } from '../common/encryptionService';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRETKEY,
        });
    }
    async validate(encryptedPayload: encryptedPayloadType | LoggedInUser): Promise<LoggedInUser> {
            let payload: LoggedInUser;
            if ('encrypted' in encryptedPayload) {
                const decryptedString = AESDecryption(encryptedPayload.encrypted, process.env.JWT_SECRETKEY);
                payload = JSON.parse(decryptedString);
            } else {
                payload = encryptedPayload as LoggedInUser; // Cast to LoggedInUser
            }
        const user = await this.authService.validateUser(payload);
        // const isvalidtoken = await this.authService.isValidtoken(payload);
        if (!user) {
            throw new HttpException(
                { statusCode: HttpCode(401), message: 'INVALID_TOKEN' },
                HttpStatus.UNAUTHORIZED
            );
        }

        // if (isvalidtoken.length == 0) {
        //     throw new NotFoundException(
        //         { statusCode: HttpCode(404), message: 'INVALID_SESSION' },
        //         'user not found'
        //     );
        // }
        return user;
    }
}
