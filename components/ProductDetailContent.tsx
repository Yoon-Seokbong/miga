// components/ProductDetailContent.tsx
import React from 'react';

interface ProductDetailContentProps {
  content: string;
}

const ProductDetailContent: React.FC<ProductDetailContentProps> = ({ content }) => {
  return (
    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
  );
};

export default ProductDetailContent;
