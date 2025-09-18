import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError, BehaviorSubject, of } from 'rxjs';
import { RegisterDto } from '../../models/RegisterDto ';
import { AuthResponse } from '../../models/AuthResponse ';
import { LoginDto } from '../../models/LoginDto ';

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'https://localhost:7200/api/User';
  private readonly isRefreshingSubject = new BehaviorSubject<boolean>(false);
  private refreshTokenInProgress = false;
  private readonly TOKEN_REFRESH_BUFFER_MINUTES = 5;
  private lastRefreshAttempt = 0;
  private readonly REFRESH_COOLDOWN = 5000; // 5 seconds

  constructor(private http: HttpClient) {}

  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, dto)
      .pipe(
        tap(res => this.saveTokens(res)),
        catchError(this.handleError.bind(this))
      );
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, dto)
      .pipe(
        tap(res => this.saveTokens(res)),
        catchError(this.handleError.bind(this))
      );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    // Rate limiting for refresh attempts
    const now = Date.now();
    if (now - this.lastRefreshAttempt < this.REFRESH_COOLDOWN) {
      return throwError(() => new Error('Too many refresh attempts. Please wait.'));
    }

    this.lastRefreshAttempt = now;
    this.refreshTokenInProgress = true;
    this.isRefreshingSubject.next(true);

    const refreshDto: RefreshTokenDto = {
      refreshToken: refreshToken
    };

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh-token`, refreshDto)
      .pipe(
        tap(response => {
          this.saveTokens({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken
          });
          
          this.refreshTokenInProgress = false;
          this.isRefreshingSubject.next(false);
        }),
        catchError((error: HttpErrorResponse) => {
          this.refreshTokenInProgress = false;
          this.isRefreshingSubject.next(false);
          
          // If refresh fails, clear tokens
          this.clearTokens();
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      const refreshDto: RefreshTokenDto = { refreshToken };
      return this.http.post(`${this.apiUrl}/logout`, refreshDto)
        .pipe(
          tap(() => this.clearTokens()),
          catchError((error) => {
            // Always clear tokens on logout, even if server call fails
            this.clearTokens();
            console.warn('Logout API call failed, but tokens cleared locally:', error);
            return of(null); // Don't throw error for logout
          })
        );
    } else {
      this.clearTokens();
      return of(null);
    }
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isAccessTokenExpired();
  }

  revokeRefreshToken(refreshToken?: string): Observable<any> {
    const tokenToRevoke = refreshToken || this.getRefreshToken();
    
    if (!tokenToRevoke) {
      return throwError(() => new Error('No refresh token to revoke'));
    }

    const refreshDto: RefreshTokenDto = { refreshToken: tokenToRevoke };
    
    return this.http.post(`${this.apiUrl}/revoke-token`, refreshDto)
      .pipe(
        tap(() => {
          if (!refreshToken) { // If revoking current user's token
            this.clearTokens();
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  private saveTokens(res: AuthResponse | RefreshTokenResponse): void {
    try {
      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
    } catch (error) {
      console.error('Failed to save tokens to localStorage:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  clearTokens(): void {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Failed to clear tokens from localStorage:', error);
    }
  }

  getAccessToken(): string | null {
    try {
      return localStorage.getItem('accessToken');
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem('refreshToken');
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Failed to parse token:', error);
      return true;
    }
  }

  isAccessTokenExpired(bufferMinutes: number = this.TOKEN_REFRESH_BUFFER_MINUTES): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const bufferTime = bufferMinutes * 60;
      return payload.exp < (currentTime + bufferTime);
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  isRefreshTokenExpired(): boolean {
    const token = this.getRefreshToken();
    return this.isTokenExpired(token || '');
  }

  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    if (!accessToken || !refreshToken) {
      return false;
    }

    // If access token is valid (with buffer), we're authenticated
    if (!this.isAccessTokenExpired(0)) { // Check actual expiry, not buffered
      return true;
    }

    // If access token expired but refresh token is valid, still authenticated
    return !this.isRefreshTokenExpired();
  }

  isRefreshingToken(): Observable<boolean> {
    return this.isRefreshingSubject.asObservable();
  }

  get isRefreshInProgress(): boolean {
    return this.refreshTokenInProgress;
  }

  // Get user info from token
  getUserInfo(): any {
    const token = this.getAccessToken();
    if (!token || this.isAccessTokenExpired(0)) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.sub || payload.userId,
        email: payload.email,
        roles: payload.roles || [],
        exp: payload.exp,
        iat: payload.iat
      };
    } catch (error) {
      console.error('Failed to parse user info from token:', error);
      return null;
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred during authentication';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Invalid credentials. Please try again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You don\'t have permission.';
          break;
        case 404:
          errorMessage = 'Service not found. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('AuthService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}