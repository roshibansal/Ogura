import React from "react";
import { Product } from "@/types";
import { DesignCard } from "./Cards";

interface PLPProductCardProps {
  product: Product;
}

export const PLPProductCard: React.FC<PLPProductCardProps> = ({ product }) => {
  return <DesignCard product={product} />;
};
