import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Login } from './login/login';
import { AuthRoutingModule } from './auth-routing-module';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    Login
  ]
})
export class AuthModule { }
