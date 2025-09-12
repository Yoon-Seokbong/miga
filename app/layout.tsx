import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/layout";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Providers from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "MIGA 쇼핑몰",
  description: "최고의 상품을 만나는 곳, MIGA 쇼핑몰입니다.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ko" className="light">
      <body>
        <Providers session={session}>
          <AuthProvider>
            <CartProvider>
              <Layout>{children}</Layout>
            </CartProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}