export interface Item {
  id: string;
  title: string;
  price: number;
  distance: number;
  image: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  ownerId: string;
}
