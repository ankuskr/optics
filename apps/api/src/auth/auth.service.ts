import {
  Injectable,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { LoginUserDto } from '../user/dto/user-login.dto';
import { RegistrationStatus } from './interfaces/regisration-status.interface';
import { LoginStatus } from './interfaces/login-status.interface';
import {
  ExamCandidateJwtPayload,
  ExternalRegisteredCandidate,
  FormRegisteredCandidate,
  LoggedInUser,
  PaasJwtPayload,
} from './interfaces/payload.interface';
import { EncryptJwtService } from './encrypt-jwt.service';
import { CandidatesService } from '../candidates/candidates.service';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../role/entities/role.entity';
import { ClientsService } from '../clients/clients.service';
import { SamlUser } from './interfaces/saml-user.interface';
import { LoginUserSsoDto } from '../user/dto/user-login-sso.dto';
import { CandidateGUIDLogin } from './dto/userLogin.dto';
import { RefreshTokenDto } from './dto/refreshtoken.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { CreateAuthDto } from './dto/user-auth.dto';
import { DonwloadExternalFileDto } from './dto/loginCredential.dto';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { ExamCandidates } from '../candidates/entities/exam_candidate.entity';
import { Candidate } from '../candidates/entities/candidate.entity';

interface Userinfo {
  user: string;
  roleInfo: string[];
}
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: EncryptJwtService,
    private readonly candidatesService: CandidatesService,
    private readonly clientsService: ClientsService,
    private readonly dataSource: DataSource,
    @InjectRepository(Auth)
    private readonly authRepo: Repository<Auth>
  ) {}

  async register(
    user: User,
    userDto: CreateUserDto
  ): Promise<RegistrationStatus> {
    let status: RegistrationStatus = {
      success: true,
      message: 'USER_REGISTERED',
    };
    user.id = '-1';

    try {
      await this.userService.create(user, userDto);
    } catch (err) {
      status = {
        success: false,
        message: err,
      };
    }

    return status;
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginStatus> {
    const user = await this.userService.findByLogin(loginUserDto);

    // const role = await
    const roleInfo = await this.dataSource
      .getRepository(Role)
      .createQueryBuilder('r')
      .select([
        'r.id as roleid',
        'r.rolename as rolename',
        'r.rolecode as rolecode',
        'r.active as active',
      ])
      .innerJoin('user_roles_tab_role', 'ur', 'ur.tabRoleId=r.id')
      .where('ur.userId=:id', { id: user.id })
      .getRawMany();

    const loggedInUser: LoggedInUser = {
      emailid: '',
      id: '',
      firstname: '',
      clientid: 0,
      iscandidate: false,
    };
    loggedInUser.id = user.id;
    loggedInUser.clientid = user.clientid;
    loggedInUser.firstname = user.firstname;
    loggedInUser.iscandidate = user.iscandidate;
    loggedInUser.emailid = user.emailid;
    loggedInUser.roleInfo = roleInfo;
    // generate and sign token
    const token = this._createToken(loggedInUser, false);
    // const refreshToken = this.generateRefreshToken(user.id);
    // await this.registerToken(false, user, token, refreshToken);
    const client = await this.clientsService.findOne(user.clientid.toString());
    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      product: client.product,
      timezone: client.timezone,
      roleinfo: roleInfo,
      // refreshToken: refreshToken,
      ...token,
    };
  }

  async loginSso(loginUserDto: LoginUserSsoDto): Promise<LoginStatus> {
    const user = await this.userService.findByLoginEmail(loginUserDto);

    // const role = await
    const roleInfo = await this.dataSource
      .getRepository(Role)
      .createQueryBuilder('r')
      .select([
        'r.id as roleid',
        'r.rolename as rolename',
        'r.rolecode as rolecode',
        'r.active as active',
      ])
      .innerJoin('user_roles_tab_role', 'ur', 'ur.tabRoleId=r.id')
      .where('ur.userId=:id', { id: user.id })
      .getRawMany();

    // generate and sign token
    const token = this._createToken(user, false);
    // const refreshToken = this.generateRefreshToken(user.id);
    // await this.registerToken(false, user, token, refreshToken);
    const client = await this.clientsService.findOne(user.clientid.toString());
    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      product: client.product,
      timezone: client.timezone,
      roleinfo: roleInfo,
      // refreshToken: refreshToken,
      ...token,
    };
  }
  async candidateLogin(loginUserDto: LoginUserDto): Promise<LoginStatus> {
    const candidate = await this.candidatesService.findByLogin(loginUserDto);
    const client = await this.clientsService.findOne(
      candidate.clientid.toString()
    );
    const user: User = new User();
    const RecordingMode = await this.clientsService.getRecordingMode(
      candidate.clientid
    );

    user.firstname = candidate.name;
    user.id = candidate.id;
    user.clientid = parseInt(candidate.clientid);
    user.emailid = candidate.emailid;

    // const refreshToken = this.generateRefreshToken(candidate.id);
    const token = this._createToken(user, true);
    // await this.registerToken(true, user, token, refreshToken);

    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      clientcode: client.clientcode,
      product: client.product,
      timezone: client.timezone,
      RecordingMode: RecordingMode,
      // refreshToken: refreshToken,
      ...token,
    };
  }

  async extRegisteredCandidateLogin(
    loginUserDto: LoginUserDto
  ): Promise<LoginStatus> {
    const candidate = await this.candidatesService.findByLogin(loginUserDto);
    const client = await this.clientsService.findOne(
      candidate.clientid.toString()
    );
    const user: FormRegisteredCandidate = {
      emailId: '',
      id: '',
      firstname: '',
      clientid: 0,
      iscandidate: true,
      isExternalRegistered: true,
      password: '',
    };
    user.firstname = candidate.name;
    user.id = candidate.id;
    user.clientid = parseInt(candidate.clientid);
    user.emailId = candidate.emailid;
    user.iscandidate = true;
    user.isExternalRegistered = true;
    user.password = candidate.password;
    const RecordingMode = await this.clientsService.getRecordingMode(
      candidate.clientid
    );

    // const refreshToken = this.generateRefreshToken(candidate.id);
    const token = this.createExtRegisteredCandidateToken(user);
    // await this.registerToken(true, user, token, refreshToken);

    return {
      emailId: user.emailId,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      clientcode: client.clientcode,
      product: client.product,
      clientname: client.clientname,
      phonenumber: candidate.phone,
      uniqueid: candidate.uniqueid,
      timezone: client.timezone,
      RecordingMode: RecordingMode,
      // refreshToken: refreshToken,
      ...token,
    };
  }

  async registerToken(isCandidate, user, token) {
    const payload: any = this.jwtService.decode(token.accessToken);
    const createAuth = new CreateAuthDto();
    createAuth.iscandidate = isCandidate;
    createAuth.jwttoken = token.accessToken;
    createAuth.userid = parseInt(user.id);
    // createAuth.refreshtoken = refreshtoken;
    createAuth.iat = payload.iat;
    createAuth.exp = payload.exp;

    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(Auth)
      .where('userid = :id', { id: user.id })
      .andWhere(`iscandidate = :iscandidate`, { iscandidate: isCandidate })
      .execute();
    const usertoken = this.authRepo.create(createAuth);
    this.authRepo.save(usertoken);
  }

  async candidateLoginSSO(loginUserDto: LoginUserSsoDto): Promise<LoginStatus> {
    const candidate = await this.candidatesService.findByLoginSSO(loginUserDto);
    const client = await this.clientsService.findOne(
      candidate.clientid.toString()
    );

    const user: User = new User();

    user.firstname = candidate.name;
    user.id = candidate.id;
    user.clientid = parseInt(candidate.clientid);
    user.emailid = candidate.emailid;
    const RecordingMode = await this.clientsService.getRecordingMode(
      candidate.clientid
    );

    // generate and sign token
    const token = this._createToken(user, true);
    // const refreshToken = this.generateRefreshToken(user.id);
    // await this.registerToken(true, user, token, refreshToken);

    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      clientcode: client.clientcode,
      product: client.product,
      timezone: client.timezone,
      RecordingMode: RecordingMode,
      // refreshToken: refreshToken,
      ...token,
    };
  }

  async candidateLoginPAAS(loginUserDto: LoginUserSsoDto): Promise<any> {
    const candidate = await this.candidatesService.findByLoginSSO(loginUserDto);
    const client = await this.clientsService.findOne(
      candidate.clientid.toString()
    );
    const candidateToken = await this.authRepo.findOne({
      where: { userid: parseInt(candidate.id), active: true },
    });
    const user: User = new User();
    const RecordingMode = await this.clientsService.getRecordingMode(
      candidate.clientid
    );

    user.firstname = candidate.name;
    user.id = candidate.id;
    user.clientid = parseInt(candidate.clientid);
    user.emailid = candidate.emailid;

    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      clientcode: client.clientcode,
      product: client.product,
      timezone: client.timezone,
      refreshToken: candidateToken.refreshtoken,
      accessToken: candidateToken.jwttoken,
      RecordingMode: RecordingMode,
    };
  }

  async candidateLoginByGUID(guid: string): Promise<LoginStatus> {
    const candidate = await this.candidatesService.findByGUID(guid);

    const user: User = new User();

    user.firstname = candidate.name;
    user.id = candidate.id;
    user.clientid = parseInt(candidate.clientid);
    user.emailid = candidate.emailid;

    // generate and sign token
    const token = this._createToken(user, true);

    // const refreshToken = this.generateRefreshToken(user.id);
    // await this.registerToken(true, user, token, refreshToken);

    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      // refreshToken: refreshToken,
      ...token,
    };
  }

  async examCandidateLoginByGUID(
    loginUserDto: CandidateGUIDLogin
  ): Promise<LoginStatus> {
    const examCandidate = await this.candidatesService.findExamCandidateByGUID(
      loginUserDto.guid
    );
    const user: ExamCandidateJwtPayload = {
      id: '',
      firstname: '',
      clientid: '',
      emailid: '',
      iscandidate: true,
      guid: '',
      examcandidateid: '',
    };

    const RecordingMode = await this.clientsService.getRecordingMode(
      examCandidate.candidate.clientid
    );
    user.firstname = examCandidate.candidate.name;
    user.id = examCandidate.candidate.id;
    user.clientid = examCandidate.candidate.clientid;
    user.emailid = examCandidate.candidate.emailid;
    user.examcandidateid = examCandidate.id;
    user.guid = examCandidate.guid;

    // generate and sign token
    const token = this._createLaunchExamToken(user);
    // const refreshToken = this.generateRefreshToken(user.id);
    // await this.registerToken(true, user, token, refreshToken);

    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      RecordingMode: RecordingMode,
      // refreshToken: refreshToken,
      ...token,
    };
  }

  async examCandidateLaunchToken(
    guid: string,
    user: User
  ): Promise<LoginStatus> {
    const examCandidate = await this.candidatesService.findExamCandidateByGUID(
      guid
    );
    const client = await this.clientsService.findOne(user.clientid.toString());
    const examCandidateDetail: ExamCandidateJwtPayload = {
      firstname: '',
      id: '',
      clientid: '',
      emailid: '',
      iscandidate: true,
      guid: '',
      examcandidateid: '',
    };
    const RecordingMode = await this.clientsService.getRecordingMode(
      examCandidate.candidate.clientid
    );
    examCandidateDetail.clientid = user.clientid.toString();
    examCandidateDetail.emailid = user.emailid;
    examCandidateDetail.examcandidateid = examCandidate.id;
    examCandidateDetail.examid = parseInt(examCandidate.exam.id);
    examCandidateDetail.firstname = examCandidate.candidate.name;
    examCandidateDetail.guid = examCandidate.guid;
    examCandidateDetail.id = user.id;
    examCandidateDetail.iscandidate = true;
    const token = this._createLaunchExamToken(examCandidateDetail);
    // const refreshToken = this.generateRefreshToken(user.id);
    // await this.registerToken(true, user, token, refreshToken);

    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      // refreshToken: refreshToken,
      product: client.product,
      timezone: client.timezone,
      clientcode: client.clientcode,
      RecordingMode: RecordingMode,
      ...token,
    };
  }

  async paasExamCandidateLoginByGUID(
    guid: string,
    privatekey: string,
    expiresIn: any,
    proctoring: any,
    userid: string,
    testdeeplink: any,
    candidate: Candidate
  ) {
    const examCandidate = await this.candidatesService.findExamCandidateByGUID(
      guid
    );
    const user = {} as PaasJwtPayload;

    user.name = examCandidate.candidate.name;
    user.userid = userid;
    user.id = examCandidate.candidate.id;
    user.clientid = examCandidate.candidate.clientid;
    user.emailid = examCandidate.candidate.emailid;
    user.guid = examCandidate.guid;
    user.proctoringSettings = proctoring;
    user.examcandidateid = examCandidate.id;
    user.examid = examCandidate.exam.id;
    user.testdeeplink = testdeeplink;
    user.photo = examCandidate.candidate?.photo;
    user.aiphoto = examCandidate.candidate?.aiphoto;

    const token = this._createPassToken(user, true, expiresIn);

    // const refreshToken = this.generateRefreshToken(examCandidate.candidate.id, true);
    await this.registerToken(true, user, token);

    return token;
  }

  private _createPassToken(
    {
      emailid,
      userid,
      name,
      clientid,
      guid,
      proctoringSettings,
      examcandidateid,
      examid,
      testdeeplink,
      id,
      photo,
      aiphoto,
    }: PaasJwtPayload,
    iscandidate: boolean,
    expiresIn: any
  ): any {
    const token: PaasJwtPayload = {
      emailid,
      userid,
      name,
      clientid,
      guid,
      iscandidate,
      examcandidateid,
      examid,
      proctoringSettings,
      testdeeplink,
      id,
      photo,
      aiphoto,
    };
    const secretKey = process.env.JWT_SECRETKEY;
    const accessToken = jwt.sign(token, secretKey, { expiresIn });
    return {
      expiresIn: expiresIn,
      accessToken,
    };
  }

  public createSsoLoginToken(
    externalRegisteredCandidate: ExternalRegisteredCandidate,
    expiresIn: any
  ): any {
    const secretKey = process.env.JWT_SECRETKEY;
    const accessToken = jwt.sign(externalRegisteredCandidate, secretKey, {
      expiresIn,
    });
    return accessToken;
  }

  async validateUser(payload: LoggedInUser): Promise<LoggedInUser> {
    const user: LoggedInUser = {
      emailid: '',
      id: '',
      firstname: '',
      clientid: 0,
      iscandidate: false,
    };
    if (payload.iscandidate) {
      const candidate = await this.candidatesService.findByPayload(payload);
      if (!candidate) {
        throw new HttpException(
          { statusCode: HttpCode(401), message: 'INVALID_TOKEN' },
          HttpStatus.UNAUTHORIZED
        );
      }
      user.firstname = candidate.name;
      user.id = candidate.id;
      user.clientid = parseInt(candidate.clientid);
      user.emailid = candidate.emailid;
      user.iscandidate = true;
      user.examcandidateid = payload.examcandidateid;
      user.guid = payload.guid;
    } else {
      const userFound = await this.userService.findByPayload(payload);
      if (!userFound) {
        throw new HttpException(
          { statusCode: HttpCode(401), message: 'INVALID_TOKEN' },
          HttpStatus.UNAUTHORIZED
        );
      }

      user.firstname = userFound.firstname;
      user.id = userFound.id;
      user.clientid = userFound.clientid;
      user.emailid = userFound.emailid;
      user.iscandidate = false;
      user.roleInfo = payload.roleInfo;
    }
    return user;
  }

  private _createToken(
    { emailid, id, firstname, clientid, roleInfo }: LoggedInUser,
    iscandidate: boolean
  ): any {
    const token: LoggedInUser = {
      emailid,
      id,
      firstname,
      clientid,
      iscandidate,
      roleInfo,
    };
    const accessToken = this.jwtService.sign(token);
    return {
      expiresIn: process.env.JWT_EXPIRESIN,
      accessToken,
    };
  }

  public createRegisteredCandidateToken({
    emailId,
    id,
    firstName,
    clientId,
    guid,
    isExternalRegistered,
    password,
  }: ExternalRegisteredCandidate): any {
    const token: ExternalRegisteredCandidate = {
      emailId,
      id,
      firstName,
      clientId,
      guid,
      isExternalRegistered,
      password,
    };
    const accessToken = this.jwtService.sign(token);
    return accessToken;
  }

  private createExtRegisteredCandidateToken({
    emailId,
    id,
    firstname,
    clientid,
    isExternalRegistered,
    password,
  }: FormRegisteredCandidate): any {
    const token: FormRegisteredCandidate = {
      emailId,
      id,
      firstname,
      clientid,
      isExternalRegistered,
      password,
      iscandidate: true,
    };
    const accessToken = this.jwtService.sign(token);
    return {
      expiresIn: process.env.JWT_EXPIRESIN,
      accessToken,
    };
  }

  private _createLaunchExamToken({
    clientid,
    emailid,
    examcandidateid,
    examid,
    firstname,
    guid,
    id,
    iscandidate,
  }: ExamCandidateJwtPayload): any {
    const token: ExamCandidateJwtPayload = {
      clientid,
      emailid,
      examcandidateid,
      examid,
      firstname,
      guid,
      id,
      iscandidate,
    };
    const accessToken = this.jwtService.sign(token);
    return {
      expiresIn: process.env.JWT_EXPIRESIN,
      accessToken,
    };
  }

  async whoIam(user: User) {
    const roleInfo = await this.dataSource
      .getRepository(Role)
      .createQueryBuilder('r')
      .select([
        'r.id as roleid',
        'r.rolename as rolename',
        'r.rolecode as rolecode',
        'r.active as active',
      ])
      .innerJoin('user_roles_tab_role', 'ur', 'ur.tabRoleId=r.id')
      .where('ur.userId=:id', { id: user.id })
      .getRawMany();

    const userInfo: Userinfo = { user: user.firstname, roleInfo: roleInfo };
    return userInfo;
  }

  getTokenForUser(user: SamlUser) {
    const payload = {
      sub: user.username,
      iss: user.issuer,
    };
    return this.jwtService.sign(payload);
  }

  // generateRefreshToken(userid, isPaasCandidate = false) {
  //     const secretkey = process.env.JWT_SECRETKEY;
  //     const expiryInSeconds = isPaasCandidate
  //         ? 1
  //         : process.env.REFRESHTOKEN_EXPIRESIN
  //         ? parseInt(process.env.REFRESHTOKEN_EXPIRESIN)
  //         : 18000;
  //     const tokenPayload = {
  //         userid: userid,
  //         expires: Math.floor(Date.now() / 1000) + expiryInSeconds, // Expiry time in seconds since UNIX epoch
  //     };
  //     const payloadString = JSON.stringify(tokenPayload);
  //     const iv = crypto.randomBytes(16);
  //     const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretkey), iv);
  //     let encryptedPayload = cipher.update(payloadString, 'utf8', 'hex');
  //     encryptedPayload += cipher.final('hex');
  //     const encryptedToken = iv.toString('hex') + encryptedPayload;
  //     return encryptedToken;
  // }

  verifyToken(token) {
    const iv = Buffer.from(token.slice(0, 32), 'hex');
    const encryptedPayload = token.slice(32);
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.JWT_SECRETKEY),
      iv
    );
    let decryptedPayload = decipher.update(encryptedPayload, 'hex', 'utf8');
    decryptedPayload += decipher.final('utf8');
    const tokenPayload = JSON.parse(decryptedPayload);
    if (tokenPayload.expires < Math.floor(Date.now() / 1000)) {
      throw new HttpException(
        { statusCode: HttpCode(401), message: 'TOKEN_EXPIRED' },
        HttpStatus.UNAUTHORIZED
      );
    }

    return tokenPayload; // Return the payload data
  }
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<any> {
    await this.verifyToken(refreshTokenDto.refreshToken);
    const tokenDetail = await this.authRepo.find({
      where: { refreshtoken: refreshTokenDto.refreshToken },
    });
    if (tokenDetail.length == 0) {
      throw new HttpException(
        { statusCode: HttpCode(401), message: 'INVALID_TOKEN' },
        HttpStatus.UNAUTHORIZED
      );
    }
    if (tokenDetail[0].iscandidate) {
      return await this.refreshJwtForCandidate(tokenDetail);
    } else {
      return await this.refreshJwtForUser(tokenDetail);
    }
  }

  async refreshJwtForCandidate(tokenDetail: any) {
    const prevTokenDetail: any = this.jwtService.decode(
      tokenDetail[0].jwttoken
    );
    const client = await this.clientsService.findOne(prevTokenDetail.clientid);
    const user: ExamCandidateJwtPayload = {
      id: '',
      firstname: '',
      clientid: '',
      emailid: '',
      iscandidate: true,
      guid: '',
      examcandidateid: '',
    };
    const RecordingMode = await this.clientsService.getRecordingMode(
      prevTokenDetail.clientid
    );
    user.firstname = prevTokenDetail.firstname;
    user.id = prevTokenDetail.id;
    user.clientid = prevTokenDetail.clientid;
    user.emailid = prevTokenDetail.emailid;
    user.examcandidateid = prevTokenDetail?.examcandidateid;
    user.guid = prevTokenDetail?.guid;
    const token = this._createLaunchExamToken(user);
    // const refreshToken = this.generateRefreshToken(user.id);
    // await this.registerToken(tokenDetail[0].iscandidate, user, token, refreshToken);
    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      clientcode: client.clientcode,
      product: client.product,
      timezone: client.timezone,
      RecordingMode: RecordingMode,
      // refreshToken: refreshToken,
      ...token,
    };
  }

  async refreshJwtForUser(tokenDetail: any) {
    const user = await this.userService.findOneUser(
      tokenDetail[0].userid.toString()
    );
    const roleInfo = await this.dataSource
      .getRepository(Role)
      .createQueryBuilder('r')
      .select([
        'r.id as roleid',
        'r.rolename as rolename',
        'r.rolecode as rolecode',
        'r.active as active',
      ])
      .innerJoin('user_roles_tab_role', 'ur', 'ur.tabRoleId=r.id')
      .where('ur.userId=:id', { id: user.id })
      .getRawMany();

    const loggedInUser: LoggedInUser = {
      emailid: '',
      id: '',
      firstname: '',
      clientid: 0,
      iscandidate: false,
    };
    const RecordingMode = await this.clientsService.getRecordingMode(
      user.clientid.toString()
    );
    loggedInUser.id = user.id;
    loggedInUser.clientid = user.clientid;
    loggedInUser.firstname = user.firstname;
    loggedInUser.iscandidate = user.iscandidate;
    loggedInUser.emailid = user.emailid;
    loggedInUser.roleInfo = roleInfo;
    // generate and sign token
    const token = this._createToken(loggedInUser, false);
    // const refreshToken = this.generateRefreshToken(user.id);
    // await this.registerToken(false, user, token, refreshToken);
    const client = await this.clientsService.findOne(user.clientid.toString());
    return {
      emailid: user.emailid,
      id: user.id,
      firstname: user.firstname,
      clientid: user.clientid,
      product: client.product,
      timezone: client.timezone,
      roleinfo: roleInfo,
      RecordingMode: RecordingMode,
      // refreshToken: refreshToken,
      ...token,
    };
  }

  async userLogout({ id, iscandidate }: User) {
    return await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(Auth)
      .where('userid = :id', { id: id })
      .andWhere(`iscandidate = :iscandidate`, { iscandidate: iscandidate })
      .execute();
  }

  async isValidtoken(payload: any) {
    return await this.authRepo.find({
      where: {
        userid: payload.id,
        active: true,
        iscandidate: payload.iscandidate,
        iat: payload.iat,
        exp: payload.exp,
        deletedAt: null,
      },
    });
  }

  async accessExternalFile(externalFileDto: DonwloadExternalFileDto) {
    const { loginid: emailid, password, userType } = externalFileDto;
    const loginUserDto: LoginUserDto = { emailid, password };

    if (userType === 'admin') {
      return this.login(loginUserDto);
    }

    return this.candidateLogin(loginUserDto);
  }
}
