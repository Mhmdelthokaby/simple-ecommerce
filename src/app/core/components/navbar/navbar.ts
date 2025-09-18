import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../Service/AuthService'; // adjust path

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Check login status on init
    this.isLoggedIn = this.authService.isAuthenticated();

    // Optional: subscribe to token refresh/changes if needed
    this.authService.isRefreshingToken().subscribe(() => {
      this.isLoggedIn = this.authService.isAuthenticated();
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggedIn = false;
        this.router.navigate(['/login']); // redirect after logout
      },
      error: err => {
        console.error(err);
        this.isLoggedIn = false;
        this.router.navigate(['/login']);
      }
    });
  }
}
