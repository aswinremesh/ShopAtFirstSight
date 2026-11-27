export type Category = 'Food' | 'Home' | 'Gifts' | 'DIY';

export interface Product {
  id: number;
  name: string;
  price: string;
  shop: string;
  distance: string;
  category: Category;
  emoji: string;
  why: string;
  badge: string;
  fresh: string;
}
