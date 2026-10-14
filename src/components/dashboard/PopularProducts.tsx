"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  sales: number;
  rating: number;
  trending: boolean;
  image: string;
};

const products: Product[] = [
  {
    id: "1",
    name: "Premium Metal Card",
    description: "Matte black metal business card with custom engraving",
    price: "$99.99",
    sales: 342,
    rating: 4.8,
    trending: true,
    image: "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?q=80&w=100&h=100&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Gold Plated Card",
    description: "Luxury gold plated business card for executives",
    price: "$149.99",
    sales: 187,
    rating: 4.9,
    trending: true,
    image: "https://images.unsplash.com/photo-1606663889134-b1dedb5ed8b7?q=80&w=100&h=100&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Digital Business Card",
    description: "NFC-enabled smart business card with digital profile",
    price: "$49.99",
    sales: 531,
    rating: 4.7,
    trending: false,
    image: "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?q=80&w=100&h=100&auto=format&fit=crop&flip=true",
  },
  {
    id: "4",
    name: "Wooden Business Card",
    description: "Eco-friendly wooden cards made from sustainable materials",
    price: "$59.99",
    sales: 215,
    rating: 4.6,
    trending: false,
    image: "https://images.unsplash.com/photo-1606663889134-b1dedb5ed8b7?q=80&w=100&h=100&auto=format&fit=crop&flip=true",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
        </svg>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

export function PopularProducts() {
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>Popular Products</CardTitle>
        <CardDescription>Top selling products this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {products.map((product) => (
            <div key={product.id} className="flex items-center">
              <img
                src={product.image}
                alt={product.name}
                className="h-14 w-14 rounded-md object-cover"
              />
              <div className="ml-4 space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">{product.name}</p>
                  {product.trending && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400">
                      Trending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <StarRating rating={product.rating} />
                  <span className="text-sm font-medium">{product.price}</span>
                </div>
              </div>
              <div className="ml-auto font-medium">
                <div className="text-sm">{product.sales} sold</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
