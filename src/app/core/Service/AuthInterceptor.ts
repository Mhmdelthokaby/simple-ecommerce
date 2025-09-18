import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError, filter, take, of } from 'rxjs';
import { AuthService } from './AuthService';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip authentication for public endpoints
    if (this.shouldSkipAuth(req.url)) {
      return next.handle(req);
    }

    // Add access token to request if available and not expired
    const accessToken = this.authService.getAccessToken();
    let authReq = req;
    
    if (accessToken && !this.authService.isAccessTokenExpired()) {
      authReq = this.addTokenToRequest(req, accessToken);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(req, next);
        }
        
        // Log other HTTP errors for debugging
        this.logError(error);
        return throwError(() => error);
      })
    );
  }

  private shouldSkipAuth(url: string): boolean {
    const publicEndpoints = [
      // Auth endpoints
      '/api/User/login',
      '/api/User/register', 
      '/api/User/refresh-token',
      
      // Public product endpoints
     
      '/api/Products/categories',
      '/api/Products/search',
      '/api/Products/featured',
      '/api/Products/recent',
      '/api/Products/paginated'
    ];
    
    // Check for exact matches and patterns
    return publicEndpoints.some(endpoint => {
      if (endpoint.endsWith('/')) {
        return url.includes(endpoint);
      }
      return url.includes(endpoint) && (
        url.endsWith(endpoint) || 
        url.includes(endpoint + '?') ||
        url.includes(endpoint + '/') ||
        this.isPublicProductEndpoint(url, endpoint)
      );
    });
  }

  private isPublicProductEndpoint(url: string, endpoint: string): boolean {
    // Allow public access to GET requests for individual products and user products
    if (endpoint === '/api/Products') {
      // Pattern: /api/Products/{id} or /api/Products/user/{userId}
      const segments = url.split('/');
      const productsIndex = segments.indexOf('Products');
      if (productsIndex >= 0 && productsIndex < segments.length - 1) {
        const nextSegment = segments[productsIndex + 1];
        // Allow numeric IDs (individual products) or 'user' (user products)
        return /^\d+$/.test(nextSegment) || nextSegment === 'user' || nextSegment === 'category';
      }
    }
    return false;
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // If no refresh token available, redirect to login immediately
    if (!this.authService.getRefreshToken()) {
      this.handleAuthFailure(req.url);
      return throwError(() => new Error('No refresh token available'));
    }

    // If refresh is already in progress, wait for it to complete
    if (this.authService.isRefreshInProgress) {
      return this.authService.isRefreshingToken().pipe(
        filter(isRefreshing => !isRefreshing),
        take(1),
        switchMap(() => {
          const newToken = this.authService.getAccessToken();
          if (newToken && !this.authService.isAccessTokenExpired()) {
            // Retry with new token
            return next.handle(this.addTokenToRequest(req, newToken));
          } else {
            // Refresh failed, redirect to login
            this.handleAuthFailure(req.url);
            return throwError(() => new Error('Token refresh failed'));
          }
        }),
        catchError((error) => {
          this.handleAuthFailure(req.url);
          return throwError(() => error);
        })
      );
    } else {
      // Start refresh process
      return this.authService.refreshToken().pipe(
        switchMap(response => {
          // Retry original request with new token
          return next.handle(this.addTokenToRequest(req, response.accessToken));
        }),
        catchError(refreshError => {
          // Refresh failed, clear tokens and redirect to login
          this.handleAuthFailure(req.url);
          return throwError(() => refreshError);
        })
      );
    }
  }

  private handleAuthFailure(currentUrl?: string): void {
    this.authService.clearTokens();
    
    // Preserve the current URL to redirect back after login
    const returnUrl = currentUrl && !currentUrl.includes('/login') ? currentUrl : this.router.url;
    
    // Navigate to login with return URL
    if (returnUrl && returnUrl !== '/login') {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl },
        replaceUrl: true 
      });
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  private addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  private logError(error: HttpErrorResponse): void {
    const errorInfo = {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.error('HTTP Error in AuthInterceptor:', errorInfo);
    
    // You could also send error reports to a logging service here
    // this.loggingService.logError(errorInfo);
  }
}