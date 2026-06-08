export type ProductCategory = "ساچمه نقره" | "شمش نقره";

export interface Product {
  id: string;
  titleFa: string;
  titleEn: string;
  category: ProductCategory;
  weightGrams: number;
  purity: "999";
  image: string;
  buyPriceRial: number;
  sellPriceRial: number;
  featured: boolean;
}

export const gramBuyPriceRial = 1_200_000;
export const gramSellPriceRial = 1_350_000;

const priceForWeight = (weightGrams: number) => ({
  buyPriceRial: weightGrams * gramBuyPriceRial,
  sellPriceRial: weightGrams * gramSellPriceRial,
});

export const products: Product[] = [
  {
    id: "farreh-shot-25g",
    titleFa: "ساچمه نقره ۲۵ گرمی",
    titleEn: "Farreh Silver Shot 25g",
    category: "ساچمه نقره",
    weightGrams: 25,
    purity: "999",
    image: "/images/products/farreh-shot-25g.jpg",
    featured: false,
    ...priceForWeight(25),
  },
  {
    id: "farreh-shot-50g",
    titleFa: "ساچمه نقره ۵۰ گرمی",
    titleEn: "Farreh Silver Shot 50g",
    category: "ساچمه نقره",
    weightGrams: 50,
    purity: "999",
    image: "/images/products/farreh-shot-50g.jpeg",
    featured: false,
    ...priceForWeight(50),
  },
  {
    id: "farreh-shot-100g",
    titleFa: "ساچمه نقره ۱۰۰ گرمی",
    titleEn: "Farreh Silver Shot 100g",
    category: "ساچمه نقره",
    weightGrams: 100,
    purity: "999",
    image: "/images/products/farreh-shot-100g.jpeg",
    featured: false,
    ...priceForWeight(100),
  },
  {
    id: "farreh-shot-250g",
    titleFa: "ساچمه نقره ۲۵۰ گرمی",
    titleEn: "Farreh Silver Shot 250g",
    category: "ساچمه نقره",
    weightGrams: 250,
    purity: "999",
    image: "/images/products/farreh-shot-250g.jpeg",
    featured: true,
    ...priceForWeight(250),
  },
  {
    id: "farreh-shot-500g",
    titleFa: "ساچمه نقره ۵۰۰ گرمی",
    titleEn: "Farreh Silver Shot 500g",
    category: "ساچمه نقره",
    weightGrams: 500,
    purity: "999",
    image: "/images/products/farreh-shot-500g.jpeg",
    featured: true,
    ...priceForWeight(500),
  },
  {
    id: "farreh-shot-1000g",
    titleFa: "ساچمه نقره ۱۰۰۰ گرمی",
    titleEn: "Farreh Silver Shot 1000g",
    category: "ساچمه نقره",
    weightGrams: 1000,
    purity: "999",
    image: "/images/products/farreh-shot-1000g.jpeg",
    featured: true,
    ...priceForWeight(1000),
  },
  {
    id: "nadir-silver-bar-1000g",
    titleFa: "شمش نقره نادیر ۱۰۰۰ گرمی",
    titleEn: "Nadir Silver Bar 1000g",
    category: "شمش نقره",
    weightGrams: 1000,
    purity: "999",
    image: "/images/products/nadir-silver-bar-1000g.jpeg",
    featured: true,
    ...priceForWeight(1000),
  },
];
