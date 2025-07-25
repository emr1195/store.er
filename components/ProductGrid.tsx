"use client";
import { PRODUCTS_QUERYResult } from "@/sanity.types";
import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { motion, AnimatePresence } from "motion/react";
import { client } from "@/sanity/lib/client";
import HomeTabbar from "./new/HomeTabbar";
import NoProductAvailable from "./new/NoProductAvailable";
import { Loader2 } from "lucide-react";
import { productType } from "@/constants";

const ProductGrid = () => {
  const [products, setProducts] = useState<PRODUCTS_QUERYResult>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  

  
  const query = `
    *[_type == "product" ${selectedTab ? '&& variant == $variant' : ''}]
    | order(_createdAt asc)
  `;
  const params = selectedTab ? { variant: selectedTab.toLowerCase() } : {};

  useEffect(() => {
    console.log(selectedTab)
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await client.fetch(query, params);
        setProducts( response);
      } catch (error) {
        console.log("Product fetching Error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTab]);

  return (
    <div className="mt-10 flex flex-col items-center">
      <HomeTabbar selectedTab={selectedTab} onTabSelect={setSelectedTab} />
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 min-h-80 space-y-4 text-center bg-gray-100 rounded-lg w-full mt-10">
          <motion.div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando...</span>
          </motion.div>
        </div>
      ) : products?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-10">
          <>
            {products.map((product) => (
              <AnimatePresence key={product?._id}>
                <motion.div
                  layout
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ProductCard key={product?._id} product={product} />
                </motion.div>
              </AnimatePresence>
            ))}
          </>
        </div>
      ) : (
        <NoProductAvailable selectedTab={selectedTab} />
      )}
    </div>
  );
};

export default ProductGrid;
