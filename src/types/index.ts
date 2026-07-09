export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  logo_url: string | null;
  cover_url: string | null;
  cuisine_type: string | null;
  rating: number | null;
  delivery_time_min: number | null;
  delivery_fee: number | null;
  minimum_order: number | null;
  is_active: boolean;
  coordinates: { lat: number; lng: number } | null;
}

export interface DishGroup {
  id: string;
  name: string;
  position: number;
  dishes: Dish[];
}

export interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  allergens: string[] | null;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_address: string | null;
  is_pickup: boolean;
  share_token: string | null;
  restaurants: { name: string; logo_url: string | null };
}
