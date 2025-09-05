import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../services/common/common-service';
import { AuthService } from '../../services/AuthService/auth-service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzCheckboxModule,
    NzFormModule,
    NzInputModule,
    RouterModule,
    CommonModule,
    HttpClientModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private spinner = inject(NgxSpinnerService);
  private commonService = inject(CommonService);
  private authService = inject(AuthService);

  // ✅ reactive form
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  passwordVisible = false;
  selectedRole: 'Student' | 'Instructor' = 'Student';

  // ✅ role selection
  selectRole(role: 'Student' | 'Instructor'): void {
    this.selectedRole = role;
  }

  // ✅ form submit
  onSubmitClick(): void {
    if (this.loginForm.invalid) {
      this.toastr.error('Please fill all required fields');
      return;
    }

    const { email, password } = this.loginForm.value;
    this.spinner.show();

    this.commonService.signin(email!, password!).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        const { success, message } = res;

        if (success) {
          this.setUserData(res);
          this.toastr.success(message || 'Signin successful');
          this.router.navigate(['/home']);
        } else {
          this.toastr.error(message || 'Signin failed');
        }
      },
      error: (err: any) => {
        this.spinner.hide();
        const errorMsg = err?.error?.message || err?.message || 'Signin failed';
        this.toastr.error(errorMsg);
      },
    });
  }

  // ✅ save user + token
  private setUserData(data: any): void {
    if (data?.user && data?.token) {
      this.authService.saveUser(data.user);
      this.authService.saveToken(data.token);
    }
  }
}
