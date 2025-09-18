export interface Product {
  id: number;
  name: string;
  productCode: string;
  category: string;
  image: string;
  price: number;
  quantity: number;
  discountRate: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}