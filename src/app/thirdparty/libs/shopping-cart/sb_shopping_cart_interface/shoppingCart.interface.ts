export interface ResponseI {
  errCode? : string
  errMsg? : string
  statusCode: number
  responseCode: string
  result: any
}

// I have to define the schema then we will update the req interface

export interface ShoppingCartInterface {
  createOrder(req): Promise<ResponseI>
  readOrder(orderId: string): Promise<ResponseI>
  updateOrder(req): Promise<ResponseI>
  deleteOrder(req): Promise<ResponseI>
  orderList(): Promise<ResponseI>
}