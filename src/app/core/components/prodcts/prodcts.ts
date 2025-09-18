import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCard } from '../product-card/product-card'; // adjust path
import { ProductService } from '../../Service/ProductService'; // adjust path
import { Product } from '../../../models/Products/Product';

@Component({
  selector: 'app-prodcts',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './prodcts.html',
  styleUrl: './prodcts.css'
})
export class Prodcts implements OnInit {
  myProducts: Product[] = [];
  loading = true;
  error: string | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadMyProducts();
  }

  loadMyProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.getMyProducts()
      .subscribe({
        next: (products) => {
          this.myProducts = products;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load products.';
          this.loading = false;
        }
      });
  }
}