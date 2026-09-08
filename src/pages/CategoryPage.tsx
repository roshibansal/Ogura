import { useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { LuxuryHeader } from "@/components/LuxuryHeader";
import { LuxuryFooter } from "@/components/LuxuryFooter";
import { CategoryHeroBanner } from "@/components/category/CategoryHeroBanner";
import { SubCategoryScroll } from "@/components/category/SubCategoryScroll";
import { FeaturedCollectionGrid } from "@/components/category/FeaturedCollectionGrid";
import { LuxeEditSection } from "@/components/category/LuxeEditSection";
import { CategoryProductGrid } from "@/components/category/CategoryProductGrid";
import { getCategoryBySlug } from "@/data/oguraCategories";
import MadeToOrderPage from "./MadeToOrderPage";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeSubCategory, setActiveSubCategory] = useState<string>("");

  // Use dedicated Made to Order page
  if (slug === "made-to-order") {
    return <MadeToOrderPage />;
  }

  const category = slug ? getCategoryBySlug(slug) : undefined;

  if (!category) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <LuxuryHeader />
      
      <main>
        {/* Hero Banner */}
        <CategoryHeroBanner
          title={category.title}
          subtitle={category.subtitle}
          heroImage={category.heroImage}
          heroVideo={category.heroVideo}
          heroPoster={category.heroPoster}
          ctaText={category.ctaText}
          ctaLink={`/category/${category.slug}#products`}
        />

        {/* Sub-Category Scroll */}
        <SubCategoryScroll
          subCategories={category.subCategories}
          onSelectSubCategory={setActiveSubCategory}
          activeFilter={activeSubCategory}
        />

        {/* Celebrity Icons Section - Only for Celebrity Fashion */}

        {/* Featured Collections */}
        {category.featuredCollections.map((collection, idx) => (
          <FeaturedCollectionGrid
            key={idx}
            collection={collection}
            categorySlug={category.slug}
          />
        ))}

        {/* Luxe Edit Section */}
        <LuxeEditSection
          luxeEdit={category.luxeEdit}
          categorySlug={category.slug}
        />

        {/* Product Grid */}
        <CategoryProductGrid
          categorySlug={category.slug}
          productCategories={category.productCategories}
          subCategoryFilter={activeSubCategory}
        />
      </main>

      <LuxuryFooter />
    </div>
  );
};

export default CategoryPage;
