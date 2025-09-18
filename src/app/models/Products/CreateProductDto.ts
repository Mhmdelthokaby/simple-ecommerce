export interface CreateProductDto {
  name: string;
  productCode: string;
  category: string;
  image: string;
  price: number;
  quantity: number;
  discountRate: number;
}