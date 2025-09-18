import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from '../../models/Products/Product';
import { CreateProductDto } from '../../models/Products/CreateProductDto';
import { UpdateProductDto } from '../../models/Products/UpdateProductDto';

export interface PaginatedProducts {
  products: Product[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  sortBy?: 'name' | 'price' | 'createdDate';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = 'https://localhost:7200/api/Products';

  constructor(private http: HttpClient) {}

  // Get all products with optional filtering and pagination (public endpoint)
  getAllProducts(filters?: ProductFilters): Observable<Product[]> {
    let params = this.buildHttpParams(filters);
    
    return this.http.get<Product[]>(`${this.apiUrl}`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Get paginated products (public endpoint)
  getPaginatedProducts(filters?: ProductFilters): Observable<PaginatedProducts> {
    let params = this.buildHttpParams(filters);
    params = params.set('paginated', 'true');
    
    return this.http.get<PaginatedProducts>(`${this.apiUrl}/paginated`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Get product by ID (public endpoint)
  getProductById(id: number): Observable<Product> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid product ID'));
    }

    return this.http.get<Product>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Get current user's products (requires authentication)
  getMyProducts(filters?: Omit<ProductFilters, 'searchTerm'>): Observable<Product[]> {
    let params = this.buildHttpParams(filters);
    
    return this.http.get<Product[]>(`${this.apiUrl}/my-products`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Get products by user ID (public endpoint)
  getUserProducts(userId: string, filters?: Omit<ProductFilters, 'searchTerm'>): Observable<Product[]> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }

    let params = this.buildHttpParams(filters);
    
    return this.http.get<Product[]>(`${this.apiUrl}/user/${userId}`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Create new product (requires authentication)
  createProduct(product: CreateProductDto): Observable<Product> {
    if (!product) {
      return throwError(() => new Error('Product data is required'));
    }

    return this.http.post<Product>(`${this.apiUrl}`, product)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Update product (requires authentication)
  updateProduct(id: number, product: UpdateProductDto): Observable<Product> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid product ID'));
    }

    if (!product) {
      return throwError(() => new Error('Product data is required'));
    }

    return this.http.put<Product>(`${this.apiUrl}/${id}`, product)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Delete product (requires authentication)
  deleteProduct(id: number): Observable<{ message: string }> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid product ID'));
    }

    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Get all categories (public endpoint)
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Search products (public endpoint)
  searchProducts(query: string, filters?: Omit<ProductFilters, 'searchTerm'>): Observable<Product[]> {
    if (!query || query.trim().length === 0) {
      return throwError(() => new Error('Search query is required'));
    }

    let params = new HttpParams().set('query', query.trim());
    
    // Add additional filters if provided
    if (filters) {
      params = this.buildHttpParams(filters, params);
    }

    return this.http.get<Product[]>(`${this.apiUrl}/search`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Get products by category (public endpoint)
  getProductsByCategory(category: string, filters?: Omit<ProductFilters, 'category'>): Observable<Product[]> {
    if (!category) {
      return throwError(() => new Error('Category is required'));
    }

    let params = new HttpParams().set('category', category);
    
    if (filters) {
      params = this.buildHttpParams(filters, params);
    }

    return this.http.get<Product[]>(`${this.apiUrl}/category/${encodeURIComponent(category)}`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Get featured products (public endpoint)
  getFeaturedProducts(limit: number = 10): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<Product[]>(`${this.apiUrl}/featured`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Get recently added products (public endpoint)
  getRecentProducts(limit: number = 10): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<Product[]>(`${this.apiUrl}/recent`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Bulk delete products (requires authentication)
  bulkDeleteProducts(productIds: number[]): Observable<{ message: string; deletedCount: number }> {
    if (!productIds || productIds.length === 0) {
      return throwError(() => new Error('Product IDs are required'));
    }

    return this.http.post<{ message: string; deletedCount: number }>(`${this.apiUrl}/bulk-delete`, { productIds })
      .pipe(catchError(this.handleError.bind(this)));
  }

  private buildHttpParams(filters?: ProductFilters, existingParams?: HttpParams): HttpParams {
    let params = existingParams || new HttpParams();

    if (filters) {
      if (filters.category) {
        params = params.set('category', filters.category);
      }
      if (filters.minPrice !== undefined) {
        params = params.set('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        params = params.set('maxPrice', filters.maxPrice.toString());
      }
      if (filters.searchTerm) {
        params = params.set('searchTerm', filters.searchTerm);
      }
      if (filters.sortBy) {
        params = params.set('sortBy', filters.sortBy);
      }
      if (filters.sortDirection) {
        params = params.set('sortDirection', filters.sortDirection);
      }
      if (filters.page !== undefined) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.pageSize !== undefined) {
        params = params.set('pageSize', filters.pageSize.toString());
      }
    }

    return params;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing your request';
    
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
          errorMessage = 'Unauthorized. Please log in to continue.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You don\'t have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Product not found.';
          break;
        case 409:
          errorMessage = 'Conflict. This action cannot be completed.';
          break;
        case 422:
          errorMessage = 'Validation failed. Please check your input.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('ProductService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}