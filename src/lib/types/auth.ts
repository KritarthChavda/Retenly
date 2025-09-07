export interface JWTPayload {
  id: string
  username: string
  type: 'admin' | 'restaurant'
  restaurantId?: string
}