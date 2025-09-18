// app.routes.ts
import { Routes } from '@angular/router';
import { Home } from '../app/core/components/home/home';
import { LoginComponent } from '../app/core/components/login/login';
import { SignupComponent } from '../app/core/components/signup/signup';


export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent }

];
