import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../Service/ProductService';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-form-component',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './product-form-component.html',
  styleUrls: ['./product-form-component.css'] // <-- fixed typo
})
export class ProductFormComponent implements OnInit {
  imageBase64: string | null = null;
  isEditMode = false;
  form!: FormGroup;
  productId!: number;

  
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      productCode: ['', Validators.required],
      category: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      discountRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      image: [null]
    });

    // Check if editing
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = +params['id'];
        this.loadProduct(this.productId);
      }
    });
  }
  

  private loadProduct(id: number) {
    this.productService.getProductById(id).subscribe(product => {
      this.form.patchValue({
        name: product.name,
        productCode: product.productCode,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
        discountRate: product.discountRate
      });
      this.imageBase64 = product.image;
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        this.imageBase64 = base64String;
        this.form.patchValue({ image: base64String });
      };
      reader.readAsDataURL(file);
    }
  }

  // Optional helper if backend requires byte array
  private convertBase64ToByteArray(base64: string): number[] {
    return Array.from(atob(base64)).map(c => c.charCodeAt(0));
  }

  onSubmit() {
    if (this.form.invalid) return;

    const dto = this.form.value;

    if (this.isEditMode) {
      this.productService.updateProduct(this.productId, dto).subscribe({
        next: () => {
          alert('Product updated successfully!');
          this.router.navigate(['/myproducts']);
        },
        error: err => console.error(err)
      });
    } else {
      this.productService.createProduct(dto).subscribe({
        next: () => {
          alert('Product created successfully!');
          this.router.navigate(['/myproducts']);
        },
        error: err => console.error(err)
      });
    }
  }
}
