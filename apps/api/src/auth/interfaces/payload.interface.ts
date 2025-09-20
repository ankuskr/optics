interface RoleInfo {
  roleid: number;
  rolename: string;
  rolecode: string;
  active: number;
}

export interface LoggedInUser {
  emailid: string;
  id: string;
  firstname: string;
  guid?: string;
  roleInfo?: RoleInfo[];
}

export interface encryptedPayloadType {
  encrypted: string;
}

export interface userRegistrstion {
  emailId: string;
  firstName: string;
  password: string;
}
