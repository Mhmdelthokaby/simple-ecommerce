import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Service/AuthService';
import { RegisterDto } from '../../../models/RegisterDto ';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
  imports: [ ReactiveFormsModule,
    CommonModule,
  RouterModule]
})
export class SignupComponent implements OnInit {
  form!: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordsMatchValidator } // custom validator
    );
  }

  private passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  
  // only enforce match if both have values
  if (!password || !confirmPassword) return null;
  
  return password === confirmPassword ? null : { passwordsMismatch: true };
};


  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    const dto: RegisterDto = {
      username: this.form.value.username,
      email: this.form.value.email,
      password: this.form.value.password
    };

    this.auth.register(dto).subscribe({
      next: res => {
        console.log('✅ Registered:', res.user);
        this.router.navigate(['/login']); // redirect to login
      },
      error: err => {
        console.error(err);
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false)
    });
  }

  // getters for cleaner template
  get username() { return this.form.get('username'); }
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }
}
