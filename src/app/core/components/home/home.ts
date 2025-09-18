import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCard } from '../product-card/product-card';
import { HeroComponent } from "../hero/hero";
import { ProductService } from '../../Service/ProductService';
import { Product } from '../../../models/Products/Product';


@Component({
  selector: 'app-home',
  imports: [CommonModule, ProductCard, HeroComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private productService = inject(ProductService);
  
  products = signal<Product[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        // Take only the first 12 products
        const limitedProducts = products.slice(0, 12);
        this.products.set(limitedProducts);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error.set('Failed to load products. Please try again later.');
        this.loading.set(false);
        
        // Fallback to empty array or you could keep some default products
        this.products.set([]);
      }
    });
  }

  // Method to retry loading products
  retryLoading(): void {
    this.loadProducts();
  }
}