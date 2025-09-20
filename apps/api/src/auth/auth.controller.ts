import {
  Controller,
  Body,
  Post,
  HttpException,
  HttpStatus,
  Get,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
  Response,
  Session,
  Logger,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { RegistrationStatus } from './interfaces/regisration-status.interface';
import { LoginStatus } from './interfaces/login-status.interface';
import { LoginUserDto } from '../user/dto/user-login.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../user/entities/user.entity';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CandidateGUIDLogin } from './dto/userLogin.dto';
import {
  DonwloadExternalFileDto,
  LoginCredentialDto,
} from './dto/loginCredential.dto';
import { Permissions } from '../authorization/permissions.guard';
import { SamlAuthGuard } from './saml/saml-auth.guard';
import express from 'express';
import { SamlStrategy } from './saml/saml.strategy';
import { SamlUser } from './interfaces/saml-user.interface';
import { LoginUserSsoDto } from '../user/dto/user-login-sso.dto';
import { LoginSSOCredentialDto } from './dto/userloginSSOCredential.dto';
import { AESEncryption } from '../common/encryptionService';
import { RefreshTokenDto } from './dto/refreshtoken.dto';
import { CacheService } from '../commonservices/cacheService';
// import { RequestWithUser } from 'passport-saml';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly samlStrategy: SamlStrategy,
    private readonly cacheService: CacheService
  ) {}

  @Post('register')
  @Permissions('CREATE_USER')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  public async register(
    @Body() createUserDto: CreateUserDto
  ): Promise<RegistrationStatus> {
    const user = <User>{};

    const result: RegistrationStatus = await this.authService.register(
      user,
      createUserDto
    );

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return result;
  }

  @Post('login')
  public async login(@Body() loginUserDto: LoginUserDto): Promise<LoginStatus> {
    return await this.authService.login(loginUserDto);
  }

  @Post('loginSSO')
  public async loginSSO(
    @Body() loginUserDto: LoginUserSsoDto
  ): Promise<LoginStatus> {
    return await this.authService.loginSso(loginUserDto);
  }

  @Post('candidateLogin')
  public async candidateLogin(
    @Body() loginCredentialDto: LoginCredentialDto
  ): Promise<LoginStatus> {
    const { loginid, password } = loginCredentialDto;
    const loginUserDto: LoginUserDto = { emailid: loginid, password };
    return await this.authService.candidateLogin(loginUserDto);
  }

  @Post('refreshToken')
  public async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<any> {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  @Post('candidateLoginSSO')
  public async candidateLoginSOO(
    @Body() loginCredentialDto: LoginSSOCredentialDto
  ): Promise<LoginStatus> {
    const { loginid } = loginCredentialDto;
    const loginUserDto: LoginUserSsoDto = { emailid: loginid };
    return await this.authService.candidateLoginSSO(loginUserDto);
  }

  @Post('candidateLoginPAAS')
  public async candidateLoginPAAS(
    @Body() loginCredentialDto: LoginSSOCredentialDto
  ): Promise<LoginStatus> {
    const { loginid } = loginCredentialDto;
    const loginUserDto: LoginUserSsoDto = { emailid: loginid };
    return await this.authService.candidateLoginPAAS(loginUserDto);
  }

  @Post('candidateLoginByGUID')
  public async candidateLoginByGUID(
    @Body() loginUserDto: CandidateGUIDLogin
  ): Promise<LoginStatus> {
    return await this.authService.candidateLoginByGUID(loginUserDto.guid);
  }

  @Post('examCandidateLoginByGUID')
  public async examCandidateLoginByGUID(
    @Body() loginUserDto: CandidateGUIDLogin
  ): Promise<LoginStatus> {
    return await this.authService.examCandidateLoginByGUID(loginUserDto);
  }

  @Get('whoami')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  public async testAuth(@Req() req: any) {
    const user = <User>req.user;
    return this.authService.whoIam(user);
  }

  @Get('saml-redirect')
  async samlRedirect(@Req() req: any, @Response() res: express.Response) {
    if (req.query && req.query['type']) {
      this.samlStrategy._saml.options.additionalParams.relayState = '';
      this.samlStrategy._saml.options.additionalParams = {
        RelayState: req.query['type'],
      };
    }
    res.redirect('/api/auth/sso/saml/login');
  }

  @Get('sso/saml/login')
  @UseGuards(SamlAuthGuard)
  async samlLogin() {
    //this route is handled by passport-saml
    return;
  }

  @Post('sso/saml/ac')
  @UseGuards(SamlAuthGuard)
  async samlAssertionConsumer(
    @Request() req: express.Request,
    @Response() res: express.Response
  ) {
    const replacerFunc = () => {
      const visited = new WeakSet();
      return (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (visited.has(value)) {
            return;
          }
          visited.add(value);
        }
        return value;
      };
    };

    if (req.user) {
      let redirectUrl = process.env.SAML_LOGIN_REDIRECT_ADMIN;
      const user = req.user as SamlUser;
      const relayState = req.body.RelayState;
      if (relayState) {
        switch (relayState) {
          case 'admin':
            redirectUrl = process.env.SAML_LOGIN_REDIRECT_ADMIN;
            break;
          case 'proctor':
            redirectUrl = process.env.SAML_LOGIN_REDIRECT_PROCTOR;
            break;
          case 'examinee':
            redirectUrl = process.env.SAML_LOGIN_REDIRECT_EXAMINEE;
            break;

          default:
            redirectUrl = process.env.SAML_LOGIN_REDIRECT_ADMIN;
            break;
        }
      }

      const samlResponse = {
        email: user.email,
        issuer: user.issuer,
      };
      const samlEncrypted = AESEncryption(JSON.stringify(samlResponse));
      // const samlEncrypted = btoa(JSON.stringify(samlResponse));
      this,
        res.redirect(
          redirectUrl + '/?saml=' + encodeURIComponent(samlEncrypted)
        );
    }
  }

  @Get('sso/saml/metadata')
  async getSpMetadata(@Response() res: express.Response) {
    const ret = this.samlStrategy.generateServiceProviderMetadata(null, null);
    res.type('application/xml');
    res.send(ret);
  }

  @Get('saml-logout')
  async samlLogout(
    @Req() req: any,
    @Session() session: Record<string, any>,
    @Response() res: express.Response
  ) {
    console.log(req);
    if (req.query && req.query['type']) {
      this.samlStrategy._saml.options.additionalParams = {
        RelayState: req.query['type'],
      };
    }
    const sloreq: any = {
      samlLogoutRequest: null,
      user: {
        nameID: req.query['email'],
        nameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      },
    };
    this.samlStrategy.logout(sloreq, function (err, request) {
      if (!err) {
        res.redirect(request);
      }
    });
  }

  @Post('userLogout')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @ApiResponse({ status: 200 })
  async userLogout(@Req() req: any): Promise<any> {
    const user = <User>req.user;
    return await this.authService.userLogout(user);
  }

  @Post('externalCandidateLogin')
  public async extRegisteredCandidateLogin(
    @Body() loginCredentialDto: LoginCredentialDto
  ): Promise<LoginStatus> {
    const { loginid, password } = loginCredentialDto;
    const loginUserDto: LoginUserDto = { emailid: loginid, password };
    return await this.authService.extRegisteredCandidateLogin(loginUserDto);
  }

  @Post('examCandidateToken/:guid')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @ApiResponse({ status: 200 })
  async examCandidateToken(
    @Param('guid') guid: string,
    @Req() req: any
  ): Promise<any> {
    const user = <User>req.user;
    return await this.authService.examCandidateLaunchToken(guid, user);
  }

  @Post('file-access')
  public async fileAccess(@Body() externalFileDto: DonwloadExternalFileDto) {
    return await this.authService.accessExternalFile(externalFileDto);
  }

  @Post('clear-cache')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  public async clearCache() {
    return this.cacheService.clearCache();
  }
}
