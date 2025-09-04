import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const AUTH_ROUTES: Routes = [
   { 
     path: '', 
     loadComponent: () => import('./login/login').then(m => m.Login) 
   }
];

@NgModule({
  imports: [RouterModule.forChild(AUTH_ROUTES)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }