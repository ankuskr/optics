import { PassportStrategy } from '@nestjs/passport';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Strategy, Profile } from 'passport-saml';
import { SamlUser } from '../interfaces/saml-user.interface';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            issuer: process.env.SAML_ISSUER,
            callbackUrl: process.env.SAML_CALLBACKURL,
            cert: process.env.SAML_CERT,
            entryPoint: process.env.SAML_ENTRYPOINT,
            wantAssertionsSigned: process.env.SAML_WANTASSERTIONSSIGNED,
            disableRequestedAuthnContext: process.env.SAML_DISABLEREQUESTEDAUTHNCONTEXT,
            logoutUrl: process.env.SAML_EXITPOINT,
        });
    }

    async validate(profile: Profile) {
        try {
            const user: SamlUser = {
                username: profile['urn:oid:0.9.2342.19200300.100.1.1'] as string,
                email: profile.nameID as string,
                issuer: profile.issuer as string,
                phone: profile['urn:oid:2.5.4.20'] as string,
            };
            return user;
        } catch (e) {
            throw new ForbiddenException('invalid user attributes');
        }
    }
}
