import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];

// ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
// FLUSH PRIVILEGES;

@NgModule({
  imports: [RouterModule.forChild(AUTH_ROUTES)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
