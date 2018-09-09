export interface CreatePriceI {
  courseId: string;
  batchId: string;
  price: number;
  benefit: number;
  payment: string;
  createdDate ?: string;
  updatedDate ?: string;
}
 export interface UpdatePriceI {
  priceId: string;
  courseId: string;
  batchId: string;
  price: number;
  benefit: number;
  payment: string;
  createdDate ?: string;
  updatedDate ?: string;
}
 export interface CoursePriceModelI {
  priceId: string;
  price: number;
  benefit: number;
  payment: string;
}