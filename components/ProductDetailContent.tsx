// components/ProductDetailContent.tsx
import React from 'react';
import parse from 'html-react-parser'; // Import the parser

interface ProductDetailContentProps {
  content: string;
}

const ProductDetailContent: React.FC<ProductDetailContentProps> = ({ content }) => {
  return (
    <div className="prose max-w-none">
      {parse(content)} 
    </div>
  );
};

export default ProductDetailContent;