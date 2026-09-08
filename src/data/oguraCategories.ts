export interface SubCategory {
  name: string;
  image: string;
  filter: string;
}

export interface FeaturedCollection {
  title: string;
  description?: string;
  images: string[];
}

export interface LuxeEdit {
  title: string;
  description: string;
  images: string[];
}

export interface OguraCategory {
  id: string;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  heroImage: string;
  heroVideo?: string;
  heroPoster?: string;
  ctaText?: string;
  cardImage: string;
  cardVideo?: string;
  cardVideoPoster?: string;
  subCategories: SubCategory[];
  featuredCollections: FeaturedCollection[];
  luxeEdit: LuxeEdit;
  productCategories: string[];
}

// Celebrity data for Celebrity Fashion page

export const oguraCategories: OguraCategory[] = [
  {
    id: "made-to-order",
    slug: "made-to-order",
    name: "Made to Order",
    title: "Made to Order",
    subtitle: "Crafted specially for you",
    heroImage: "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=1920&q=90",
    heroVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768726916/19ygmntpw5rmy0cvt1arvsffr0_result__be5kbh.mp4",
    heroPoster: "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=1920&q=90",
    ctaText: "Explore Bespoke",
    cardImage: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=90",
    cardVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768726916/19ygmntpw5rmy0cvt1arvsffr0_result__be5kbh.mp4",
    cardVideoPoster: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=90",
    subCategories: [
      { name: "Bridal", image: "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=200&q=80", filter: "bridal" },
      { name: "Lehengas", image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=200&q=80", filter: "lehenga" },
      { name: "Sarees", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&q=80", filter: "saree" },
      { name: "Gowns", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200&q=80", filter: "gown" },
      { name: "Suits", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=200&q=80", filter: "suit" },
    ],
    featuredCollections: [
      {
        title: "Bridal Dreams",
        images: [
          "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=600&q=80",
          "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&q=80",
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
          "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80",
        ],
      },
      {
        title: "Custom Couture",
        images: [
          "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
          "https://images.unsplash.com/photo-1594819047050-99defca82545?w=600&q=80",
          "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80",
        ],
      },
    ],
    luxeEdit: {
      title: "OGURA Bespoke Luxe Edit",
      description: "Handcrafted with precision. Each piece made exclusively for you with the finest materials and artisanal craftsmanship.",
      images: [
        "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=800&q=90",
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=90",
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=90",
      ],
    },
    productCategories: ["dresses", "lehengas", "sarees"],
  },
  {
    id: "co-ord-sets",
    slug: "co-ord-sets",
    name: "Co-ord Sets",
    title: "Co-ord Sets",
    subtitle: "Effortless matching styles for modern wardrobes",
    heroImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=90",
    heroVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768728765/ekk60tp1qhrmt0cvt1s9gz5xtw_result__kgwj0e.mp4",
    heroPoster: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=90",
    ctaText: "Shop Matching Sets",
    cardImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=90",
    cardVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768728765/ekk60tp1qhrmt0cvt1s9gz5xtw_result__kgwj0e.mp4",
    cardVideoPoster: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=90",
    subCategories: [
      { name: "Printed Sets", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80", filter: "printed" },
      { name: "Solid Sets", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200&q=80", filter: "solid" },
      { name: "Crop Top Sets", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=200&q=80", filter: "crop-top" },
      { name: "Blazer Sets", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&q=80", filter: "blazer" },
      { name: "Casual Sets", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200&q=80", filter: "casual" },
      { name: "Party Sets", image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=200&q=80", filter: "party" },
    ],
    featuredCollections: [
      {
        title: "New Arrivals",
        images: [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80",
          "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
        ],
      },
      {
        title: "Weekend Vibes",
        images: [
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80",
          "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80",
          "https://images.unsplash.com/photo-1485968579169-51d9b75d83c0?w=600&q=80",
          "https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?w=600&q=80",
        ],
      },
    ],
    luxeEdit: {
      title: "OGURA Luxe Co-ord Edit",
      description: "Perfectly paired pieces for the modern woman. Effortless coordination meets luxury craftsmanship.",
      images: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=90",
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=90",
      ],
    },
    productCategories: ["tops", "skirts", "pants"],
  },
  {
    id: "occasion-wear",
    slug: "occasion-wear",
    name: "Occasion Wear",
    title: "Occasion Wear",
    subtitle: "Festive & celebration-ready styles",
    heroImage: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1920&q=90",
    heroVideo: "https://res.cloudinary.com/dpnosz8im/video/upload/v1768725355/t88wqe2hy5rmy0cvt0z8c534s8_result__flnqjk.mp4",
    heroPoster: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1920&q=90",
    ctaText: "Shop Occasion Wear",
    cardImage: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=90",
    cardVideo: "https://res.cloudinary.com/dpnosz8im/video/upload/v1768725355/t88wqe2hy5rmy0cvt0z8c534s8_result__flnqjk.mp4",
    cardVideoPoster: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=90",
    subCategories: [
      { name: "Wedding Guest", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200&q=80", filter: "wedding" },
      { name: "Party Wear", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&q=80", filter: "party" },
      { name: "Festive", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&q=80", filter: "festive" },
      { name: "Cocktail", image: "https://images.unsplash.com/photo-1562137369-1a1a0bc66744?w=200&q=80", filter: "cocktail" },
      { name: "Reception", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&q=80", filter: "reception" },
      { name: "Sangeet", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&q=80", filter: "sangeet" },
    ],
    featuredCollections: [
      {
        title: "Wedding Season",
        images: [
          "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80",
          "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80",
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
          "https://images.unsplash.com/photo-1562137369-1a1a0bc66744?w=600&q=80",
        ],
      },
      {
        title: "Party Perfect",
        images: [
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
          "https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=600&q=80",
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80",
        ],
      },
    ],
    luxeEdit: {
      title: "OGURA Luxe Occasion Edit",
      description: "Make every moment memorable with our exquisite occasion wear collection, designed for life's most special celebrations.",
      images: [
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=90",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=90",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=90",
      ],
    },
    productCategories: ["dresses", "gowns"],
  },
  {
    id: "street-casual",
    slug: "street-casual",
    name: "Street & Casual",
    title: "Street & Casual",
    subtitle: "Everyday comfort meets modern street style",
    heroImage: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1920&q=90",
    heroVideo: "https://res.cloudinary.com/dpnosz8im/video/upload/v1768726004/g7h46ecqsdrmw0cvt14985g7fr_result__dctjte.mp4",
    heroPoster: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1920&q=90",
    ctaText: "Shop Street Style",
    cardImage: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=90",
    cardVideo: "https://res.cloudinary.com/dpnosz8im/video/upload/v1768726004/g7h46ecqsdrmw0cvt14985g7fr_result__dctjte.mp4",
    cardVideoPoster: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=90",
    subCategories: [
      { name: "Casual Tops", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80", filter: "casual-tops" },
      { name: "Co-ord Casual Sets", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80", filter: "coord-casual" },
      { name: "Street Dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&q=80", filter: "street-dresses" },
      { name: "Oversized Fits", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&q=80", filter: "oversized" },
      { name: "Lounge Wear", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=200&q=80", filter: "lounge" },
    ],
    featuredCollections: [
      {
        title: "New Casual Arrivals",
        images: [
          "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&q=80",
          "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80",
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
        ],
      },
      {
        title: "Everyday Essentials",
        images: [
          "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80",
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
          "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
        ],
      },
      {
        title: "Trending Street Looks",
        images: [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
        ],
      },
    ],
    luxeEdit: {
      title: "OGURA Street Luxe Edit",
      description: "Where comfort meets couture. Elevated everyday essentials for the urban explorer.",
      images: [
        "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=90",
        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=90",
      ],
    },
    productCategories: ["tops", "pants", "jackets"],
  },
  {
    id: "limited-drops",
    slug: "limited-drops",
    name: "Limited Drops",
    title: "Limited Drops",
    subtitle: "Exclusive styles. Limited availability.",
    heroImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=90",
    heroVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768726481/n074nvqgt9rmw0cvt1696aag3w_result__r9ng7h.mp4",
    heroPoster: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=90",
    ctaText: "Shop Limited Drops",
    cardImage: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=90",
    cardVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768726481/n074nvqgt9rmw0cvt1696aag3w_result__r9ng7h.mp4",
    cardVideoPoster: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=90",
    subCategories: [
      { name: "This Week", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80", filter: "this-week" },
      { name: "Designer Collabs", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&q=80", filter: "collab" },
      { name: "Runway Picks", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200&q=80", filter: "runway" },
      { name: "Exclusive", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80", filter: "exclusive" },
      { name: "Pre-Order", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=200&q=80", filter: "pre-order" },
    ],
    featuredCollections: [
      {
        title: "Just Dropped",
        images: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
        ],
      },
      {
        title: "Selling Fast",
        images: [
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80",
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80",
          "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80",
          "https://images.unsplash.com/photo-1485968579169-51d9b75d83c0?w=600&q=80",
        ],
      },
    ],
    luxeEdit: {
      title: "OGURA Limited Luxe Edit",
      description: "Rare finds for the discerning collector. Once they're gone, they're gone forever.",
      images: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=90",
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=90",
      ],
    },
    productCategories: ["dresses", "tops", "accessories"],
  },
  {
    id: "footwear-edit",
    slug: "footwear-edit",
    name: "Footwear Edit",
    title: "Footwear Edit",
    subtitle: "Step into style – statement footwear for every look",
    heroImage: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1920&q=90",
    heroVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768727437/pdc7kwtt9nrmt0cvt1f9jmjmyw_result__c49r5p.mp4",
    heroPoster: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1920&q=90",
    ctaText: "Shop Footwear",
    cardImage: "https://images.unsplash.com/photo-1518049362265-d5b2a6467571?w=800&q=90",
    cardVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768727437/pdc7kwtt9nrmt0cvt1f9jmjmyw_result__c49r5p.mp4",
    cardVideoPoster: "https://images.unsplash.com/photo-1518049362265-d5b2a6467571?w=800&q=90",
    subCategories: [
      { name: "Heels", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&q=80", filter: "heels" },
      { name: "Flats", image: "https://images.unsplash.com/photo-1518049362265-d5b2a6467571?w=200&q=80", filter: "flats" },
      { name: "Sandals", image: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=200&q=80", filter: "sandals" },
      { name: "Sneakers", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&q=80", filter: "sneakers" },
      { name: "Festive Footwear", image: "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=200&q=80", filter: "festive" },
    ],
    featuredCollections: [
      {
        title: "Trending Now",
        images: [
          "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
          "https://images.unsplash.com/photo-1518049362265-d5b2a6467571?w=600&q=80",
          "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80",
          "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600&q=80",
        ],
      },
      {
        title: "Everyday Comfort",
        images: [
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80",
          "https://images.unsplash.com/photo-1542280756-74b2f55e73ab?w=600&q=80",
          "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80",
          "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80",
        ],
      },
      {
        title: "Festive Footwear Picks",
        images: [
          "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600&q=80",
          "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
          "https://images.unsplash.com/photo-1518049362265-d5b2a6467571?w=600&q=80",
          "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80",
        ],
      },
    ],
    luxeEdit: {
      title: "OGURA Footwear Luxe Edit",
      description: "Walk in elegance. From red carpets to city streets, find your perfect pair.",
      images: [
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=90",
        "https://images.unsplash.com/photo-1518049362265-d5b2a6467571?w=800&q=90",
      ],
    },
    productCategories: ["footwear"],
  },
  {
    id: "bags-accessories",
    slug: "bags-accessories",
    name: "Bags & Accessories",
    title: "Bags & Accessories",
    subtitle: "Elevate every look with statement details",
    heroImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1920&q=90",
    heroVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768727700/ypkv23106xrmw0cvt1h8ddvvhc_result__ffbnha.mp4",
    heroPoster: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1920&q=90",
    ctaText: "Shop Accessories",
    cardImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=90",
    cardVideo: "https://res.cloudinary.com/dow8lbkui/video/upload/v1768727700/ypkv23106xrmw0cvt1h8ddvvhc_result__ffbnha.mp4",
    cardVideoPoster: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=90",
    subCategories: [
      { name: "Handbags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&q=80", filter: "handbag" },
      { name: "Sling Bags", image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=200&q=80", filter: "sling" },
      { name: "Clutches", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=80", filter: "clutch" },
      { name: "Jewellery", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=80", filter: "jewelry" },
      { name: "Belts & Extras", image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=200&q=80", filter: "belt" },
    ],
    featuredCollections: [
      {
        title: "Trending Accessories",
        images: [
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
          "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&q=80",
          "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80",
        ],
      },
      {
        title: "Everyday Essentials",
        images: [
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
          "https://images.unsplash.com/photo-1601370690183-1c7796ecec61?w=600&q=80",
          "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80",
          "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80",
        ],
      },
      {
        title: "Statement Picks",
        images: [
          "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80",
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
        ],
      },
    ],
    luxeEdit: {
      title: "OGURA Accessories Luxe Edit",
      description: "The finishing touch that makes all the difference. Curated accessories for the style-conscious.",
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=90",
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=90",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=90",
      ],
    },
    productCategories: ["accessories", "bags"],
  },
];

export const getCategoryBySlug = (slug: string): OguraCategory | undefined => {
  return oguraCategories.find((category) => category.slug === slug);
};
