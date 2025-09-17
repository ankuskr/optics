import { inject, Injectable } from '@angular/core';
import { environment } from 'apps/optics/src/environments/environment';
import { Observable } from 'rxjs';
import { RestClient } from '../RestClient/rest-client';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  // constructor(private client: RestClient) {}
  private client = inject(RestClient);
  signupData: any;

  sendOtp(email: string): Observable<any> {
    return this.client.post('auth/sendotp', { email });
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.client.post('auth/verify-otp', { email, otp });
  }

  createUser(formData: any, otp: string): Observable<any> {
    return this.client.post('auth/signup', { ...formData, otp });
  }

  signin(email: string, password: string): Observable<any> {
    return this.client.post('auth/login', { email, password });
  }

  forgotPassword(email: string) {
    return this.client.post('auth/reset-password-token', { email });
  }

  updatePassword(password: any): Observable<any> {
    console.log('password');
    return this.client.post('auth/reset-password', password);
  }
  tokenVAlidateion(token: string): Observable<any> {
    console.log('token', token);
    return this.client.post('auth/update-password-token', token);
  }

  getAvatarUrl(firstName: string, lastName: string) {
    const seed = encodeURIComponent(`${firstName} ${lastName}`);
    return `${environment.avatars}${seed}`;
  }
}
