import type { Product } from './types';

// Demo inventory. Replace this module with the team's inventory API when it is ready.
export const products: Product[] = [
  { id: 1, name: 'Smoky paprika oil', price: '€8.50', shop: 'The Little Grocer', distance: '0.3 km', category: 'Food', emoji: '🫒', why: 'A drizzle turns roasted veg or hummus into something special.', badge: 'Shop pick', fresh: 'Stock checked 12 min ago' },
  { id: 2, name: 'Speckled breakfast bowl', price: '€22', shop: 'Clay & Kind', distance: '0.7 km', category: 'Home', emoji: '🥣', why: 'Hand-thrown locally; lovely for porridge, snacks or keys by the door.', badge: 'Small batch', fresh: 'Stock checked 28 min ago' },
  { id: 3, name: 'Wildflower seed kit', price: '€12', shop: 'Green Corner', distance: '1.1 km', category: 'DIY', emoji: '🌼', why: 'A tiny windowsill project that brings pollinators to your patch.', badge: 'Easy project', fresh: 'Stock checked 1 hr ago' },
  { id: 4, name: 'Cocoa & orange shortbread', price: '€6', shop: 'Mallow Bakery', distance: '0.4 km', category: 'Food', emoji: '🍪', why: 'A small-batch treat made this morning. Best enjoyed with a cup of tea.', badge: 'Baked today', fresh: 'Stock checked 8 min ago' },
  { id: 5, name: 'Linen knot headband', price: '€16', shop: 'Thread & Thistle', distance: '1.4 km', category: 'Gifts', emoji: '🎀', why: 'Made from reclaimed fabric, so every pattern is a little different.', badge: 'One of a kind', fresh: 'Stock checked 2 hrs ago' },
  { id: 6, name: 'Tiny herb trio', price: '€14', shop: 'Green Corner', distance: '1.1 km', category: 'Food', emoji: '🌿', why: 'Basil, chives and parsley for a windowsill that earns its keep.', badge: 'Grow at home', fresh: 'Stock checked 35 min ago' },
];
