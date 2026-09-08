// Centralized menu data structure for Nykaa-style navigation

export interface SubCategory {
  name: string;
  slug: string;
}

export interface Category {
  name: string;
  slug: string;
  image?: string;
  video?: string;
  subCategories: SubCategory[];
}

export interface MenuSection {
  categories: Category[];
}

// Women's menu data
export const womenMenu: MenuSection = {
  categories: [
    {
      name: "Bollywood Fashion",
      slug: "bollywood-fashion",
      video: "https://videos.pexels.com/video-files/4125383/4125383-uhd_2560_1440_30fps.mp4",
      subCategories: [
        { name: "Sarees", slug: "sarees" },
        { name: "Lehengas", slug: "lehengas" },
        { name: "Indo-Western", slug: "indo-western" },
        { name: "Festive Sets", slug: "festive-sets" },
        { name: "Anarkalis", slug: "anarkalis" },
        { name: "Celebrity Picks", slug: "celebrity-picks" },
      ],
    },
    {
      name: "Co-ord Sets",
      slug: "co-ord-sets",
      image: "/roshi/product-1.jpg",
      subCategories: [
        { name: "Printed Sets", slug: "printed" },
        { name: "Solid Sets", slug: "solid" },
        { name: "Party Sets", slug: "party" },
        { name: "Casual Sets", slug: "casual" },
        { name: "Crop Top Sets", slug: "crop-top-sets" },
        { name: "Blazer Sets", slug: "blazer-sets" },
      ],
    },
    {
      name: "Occasion Wear",
      slug: "occasion-wear",
      image: "/roshi/product-2.jpg",
      subCategories: [
        { name: "Festive", slug: "festive" },
        { name: "Wedding", slug: "wedding" },
        { name: "Evening", slug: "evening" },
        { name: "Cocktail", slug: "cocktail" },
        { name: "Reception", slug: "reception" },
        { name: "Sangeet", slug: "sangeet" },
      ],
    },
    {
      name: "Street & Casual",
      slug: "street-casual",
      image: "/roshi/product-3.jpg",
      subCategories: [
        { name: "Dresses", slug: "dresses" },
        { name: "Tops", slug: "tops" },
        { name: "Jeans", slug: "jeans" },
        { name: "Skirts", slug: "skirts" },
        { name: "Jumpsuits", slug: "jumpsuits" },
        { name: "Loungewear", slug: "loungewear" },
      ],
    },
    {
      name: "Limited Drops",
      slug: "limited-drops",
      image: "/roshi/product-4.jpg",
      subCategories: [
        { name: "New This Week", slug: "new-this-week" },
        { name: "Trending Now", slug: "trending-now" },
        { name: "Back In Stock", slug: "back-in-stock" },
        { name: "Last Chance", slug: "last-chance" },
      ],
    },
    {
      name: "Made-to-Order",
      slug: "made-to-order",
      image: "/roshi/product-5.jpg",
      subCategories: [
        { name: "Bridal", slug: "bridal" },
        { name: "Custom Lehengas", slug: "custom-lehengas" },
        { name: "Bespoke Sarees", slug: "bespoke-sarees" },
        { name: "Designer Suits", slug: "designer-suits" },
      ],
    },
    {
      name: "Footwear Edit",
      slug: "footwear",
      image: "/roshi/product-6.jpg",
      subCategories: [
        { name: "Heels", slug: "heels" },
        { name: "Flats", slug: "flats" },
        { name: "Wedges", slug: "wedges" },
        { name: "Sandals", slug: "sandals" },
        { name: "Boots", slug: "boots" },
      ],
    },
    {
      name: "Bags & Accessories",
      slug: "bags-accessories",
      image: "/roshi/product-7.jpg",
      subCategories: [
        { name: "Handbags", slug: "handbags" },
        { name: "Clutches", slug: "clutches" },
        { name: "Jewellery", slug: "jewellery" },
        { name: "Scarves", slug: "scarves" },
        { name: "Belts", slug: "belts" },
      ],
    },
  ],
};

// Men's menu data
export const menMenu: MenuSection = {
  categories: [
    {
      name: "Ethnic Wear",
      slug: "ethnic-wear",
      image: "/indigo/product-1.jpg",
      subCategories: [
        { name: "Kurtas", slug: "kurtas" },
        { name: "Sherwanis", slug: "sherwanis" },
        { name: "Nehru Jackets", slug: "nehru-jackets" },
        { name: "Dhotis", slug: "dhotis" },
        { name: "Kurta Sets", slug: "kurta-sets" },
      ],
    },
    {
      name: "Formal Wear",
      slug: "formal-wear",
      image: "/indigo/product-2.jpg",
      subCategories: [
        { name: "Suits", slug: "suits" },
        { name: "Blazers", slug: "blazers" },
        { name: "Formal Shirts", slug: "formal-shirts" },
        { name: "Trousers", slug: "trousers" },
        { name: "Ties & Pocket Squares", slug: "ties-pocket-squares" },
      ],
    },
    {
      name: "Casual Wear",
      slug: "casual-wear",
      image: "/indigo/product-3.jpg",
      subCategories: [
        { name: "T-Shirts", slug: "t-shirts" },
        { name: "Casual Shirts", slug: "casual-shirts" },
        { name: "Jeans", slug: "jeans" },
        { name: "Chinos", slug: "chinos" },
        { name: "Shorts", slug: "shorts" },
      ],
    },
    {
      name: "Activewear",
      slug: "activewear",
      image: "/indigo/product-4.jpg",
      subCategories: [
        { name: "Sports T-Shirts", slug: "sports-t-shirts" },
        { name: "Track Pants", slug: "track-pants" },
        { name: "Hoodies", slug: "hoodies" },
        { name: "Gym Wear", slug: "gym-wear" },
      ],
    },
    {
      name: "Footwear",
      slug: "footwear",
      image: "/indigo/product-5.jpg",
      subCategories: [
        { name: "Formal Shoes", slug: "formal-shoes" },
        { name: "Sneakers", slug: "sneakers" },
        { name: "Loafers", slug: "loafers" },
        { name: "Sandals", slug: "sandals" },
        { name: "Boots", slug: "boots" },
      ],
    },
    {
      name: "Accessories",
      slug: "accessories",
      image: "/roshi/product-8.jpg",
      subCategories: [
        { name: "Watches", slug: "watches" },
        { name: "Wallets", slug: "wallets" },
        { name: "Belts", slug: "belts" },
        { name: "Sunglasses", slug: "sunglasses" },
        { name: "Bags", slug: "bags" },
      ],
    },
  ],
};

// Brands data for mega menu
export interface BrandItem {
  name: string;
  slug: string;
  logo?: string;
  isFeatured?: boolean;
  isDesigner?: boolean;
  isInHouse?: boolean;
}

export const featuredBrands: BrandItem[] = [
  { name: "Aranya Studio", slug: "aranya-studio", isFeatured: true, isDesigner: true },
  { name: "Sootra Atelier", slug: "sootra-atelier", isFeatured: true, isDesigner: true },
  { name: "Neelambari", slug: "neelambari", isFeatured: true, isDesigner: true },
  { name: "Roopkatha Label", slug: "roopkatha-label", isFeatured: true, isDesigner: true },
  { name: "Chhaya & Co.", slug: "chhaya-co", isFeatured: true, isDesigner: true },
  { name: "Ogura Official", slug: "ogura-official", isFeatured: true, isInHouse: true },
];

export const allBrands: BrandItem[] = [
  { name: "Kaarigari House", slug: "kaarigari-house", isDesigner: true },
  { name: "Aranya Studio", slug: "aranya-studio", isDesigner: true },
  { name: "Anant Threadworks", slug: "anant-threadworks", isDesigner: true },
  { name: "Beli & Co.", slug: "beli-co" },
  { name: "Loomwala", slug: "loomwala" },
  { name: "Meher & Noor", slug: "meher-noor", isDesigner: true },
  { name: "Safar Label", slug: "safar-label" },
  { name: "House of Jamun", slug: "house-of-jamun", isDesigner: true },
  { name: "Indya", slug: "indya" },
  { name: "Kanthaa Studio", slug: "kanthaa-studio", isDesigner: true },
  { name: "Libas", slug: "libas" },
  { name: "Roopkatha Label", slug: "roopkatha-label", isDesigner: true },
  { name: "Ogura Official", slug: "ogura-official", isInHouse: true },
  { name: "Baagh Studio", slug: "baagh-studio", isDesigner: true },
  { name: "Ranghar Studio", slug: "ranghar-studio", isDesigner: true },
  { name: "Chhaya & Co.", slug: "chhaya-co", isDesigner: true },
  { name: "Roshi", slug: "roshi", isDesigner: true },
  { name: "Neelambari", slug: "neelambari", isDesigner: true },
  { name: "Sahil & Vir", slug: "sahil-vir", isDesigner: true },
  { name: "Sootra Atelier", slug: "sootra-atelier", isDesigner: true },
  { name: "W", slug: "w" },
];

// Filter options
export const filterOptions = {
  sizes: ["XS", "S", "M", "L", "XL", "XXL", "Free Size"],
  colors: [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Red", hex: "#DC2626" },
    { name: "Blue", hex: "#2563EB" },
    { name: "Green", hex: "#16A34A" },
    { name: "Yellow", hex: "#EAB308" },
    { name: "Pink", hex: "#5A0A26" },
    { name: "Purple", hex: "#9333EA" },
    { name: "Orange", hex: "#EA580C" },
    { name: "Brown", hex: "#92400E" },
    { name: "Beige", hex: "#D4C4A8" },
    { name: "Grey", hex: "#6B7280" },
    { name: "Navy", hex: "#1E3A5F" },
    { name: "Maroon", hex: "#7F1D1D" },
    { name: "Gold", hex: "#C9A56B" },
    { name: "Silver", hex: "#C0C0C0" },
  ],
  fabrics: [
    "Cotton",
    "Silk",
    "Linen",
    "Chiffon",
    "Georgette",
    "Velvet",
    "Satin",
    "Crepe",
    "Organza",
    "Net",
    "Rayon",
    "Polyester",
  ],
  occasions: [
    "Casual",
    "Festive",
    "Wedding",
    "Party",
    "Office",
    "Beach",
    "Brunch",
    "Date Night",
  ],
  fits: ["Regular", "Slim", "Relaxed", "Oversized", "Tailored"],
  discounts: [
    { label: "10% and above", value: 10 },
    { label: "20% and above", value: 20 },
    { label: "30% and above", value: 30 },
    { label: "40% and above", value: 40 },
    { label: "50% and above", value: 50 },
  ],
  priceRanges: [
    { label: "Under ₹1,000", min: 0, max: 1000 },
    { label: "₹1,000 - ₹3,000", min: 1000, max: 3000 },
    { label: "₹3,000 - ₹5,000", min: 3000, max: 5000 },
    { label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
    { label: "₹10,000 - ₹20,000", min: 10000, max: 20000 },
    { label: "Above ₹20,000", min: 20000, max: 999999 },
  ],
  sortOptions: [
    { label: "Popularity", value: "popularity" },
    { label: "New Arrivals", value: "newest" },
    { label: "Price: Low to High", value: "price-low" },
    { label: "Price: High to Low", value: "price-high" },
    { label: "Discount", value: "discount" },
    { label: "Customer Rating", value: "rating" },
  ],
};

// Top navigation items
export const topNavItems = [
  { label: "New In", path: "/new-in", hasMegaMenu: false },
  { label: "Women", path: "/women", hasMegaMenu: true, menuType: "women" as const },
  { label: "Men", path: "/men", hasMegaMenu: true, menuType: "men" as const },
  { label: "Brands", path: "/brands", hasMegaMenu: true, menuType: "brands" as const },
  { label: "Ogura Edit", path: "/ogura-edit", hasMegaMenu: false },
  { label: "Sale", path: "/sale", hasMegaMenu: false },
];
