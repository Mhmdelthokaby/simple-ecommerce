import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../Service/ProductService';
import { Product } from '../../../models/Products/Product';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css']
})
export class ProductDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private router = inject(Router);

  product: Product | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.productService.getProductById(id).subscribe({
        next: (res) => {
          this.product = res;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load product details.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Invalid product ID.';
      this.loading = false;
    }
  }

  editProduct(id: number): void {
    this.router.navigate(['/edit-product', id]);
  }

  deleteProduct(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        alert('Product deleted successfully.');
        this.router.navigate(['/products']); // redirect after deletion
      },
      error: () => {
        alert('Failed to delete product.');
      }
    });
  }
}
