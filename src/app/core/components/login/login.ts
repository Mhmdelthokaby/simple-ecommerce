import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router ,RouterModule } from '@angular/router'; // Only if you need navigation
import { AuthService } from '../../Service/AuthService';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, ReactiveFormsModule ,RouterModule]
})
export class LoginComponent {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService,
    private router: Router // Only inject if you need navigation
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.auth.login(this.form.getRawValue()).subscribe({
        next: res => {
          console.log('Logged in:', res.user);
          this.isLoading = false;
          this.router.navigate(['/']); // Navigate to home after login
        },
        error: err => {
          console.error('Login error:', err);
          this.errorMessage = err.error?.message || 'Login failed. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  // Helper methods for template
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
}