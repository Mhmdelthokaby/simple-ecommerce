import { Component, Input } from '@angular/core';
import { CurrencyPipe, NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, NgIf],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css']
})
export class ProductCard {
  @Input() id!: number;   // ✅ add product ID
  @Input() image: string = '';
  @Input() name: string = '';
  @Input() price: number = 0;
  @Input() discount: number = 0;

  constructor(private router: Router) {}

  get discountedPrice(): number {
    return this.price - (this.price * this.discount / 100);
  }

  viewDetails() {
    this.router.navigate(['/products', this.id]);
  }
}
