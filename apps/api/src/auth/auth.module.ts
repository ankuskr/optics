import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { CandidatesModule } from '../candidates/candidates.module';
import { ClientsModule } from '../clients/clients.module';
import { JwtAuthGuard } from './saml/jwt-auth.guard';
import { SamlAuthGuard } from './saml/saml-auth.guard';
import { SamlStrategy } from './saml/saml.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { EncryptJwtService } from './encrypt-jwt.service';
import { CommonservicesModule } from '../commonservices/commonservices.module';

@Module({
    imports: [
        UserModule,
        CandidatesModule,
        ClientsModule,
        CommonservicesModule,
        PassportModule.register({
            defaultStrategy: 'jwt',
            property: 'user',
            session: true,
        }),

        JwtModule.register({
            secret: process.env.JWT_SECRETKEY,
            signOptions: {
                expiresIn: process.env.JWT_EXPIRESIN,
            },
        }),
        TypeOrmModule.forFeature([Auth]),
    ],

    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        SamlAuthGuard,
        SamlStrategy,
        EncryptJwtService,
    ],
    exports: [PassportModule, JwtModule, AuthService, SamlStrategy],
})
export class AuthModule {}
