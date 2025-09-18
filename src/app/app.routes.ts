import { Routes } from '@angular/router';
import { Home } from './core/components/home/home';
import { LoginComponent } from './core/components/login/login';
import { SignupComponent } from './core/components/signup/signup';
import { ProductDetails } from './core/components/product-details/product-details';
import { ProductFormComponent } from './core/components/product-form-component/product-form-component';
import { AuthGuard } from './core/Guard/AuthGuard';
import { Prodcts } from './core/components/prodcts/prodcts';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'products/:id', component: ProductDetails }, 
  { path: 'my-products', component: Prodcts, canActivate: [AuthGuard] },
  { path: 'create-product', component: ProductFormComponent, canActivate: [AuthGuard] }, // protected
  { path: 'edit-product/:id', component: ProductFormComponent, canActivate: [AuthGuard] }, // protected
  { path: '**', redirectTo: '' } 
];
