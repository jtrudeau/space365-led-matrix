import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPACE365 LED Matrix Animator",
  description:
    "8x8 WS2812B LED matrix animator for SPACE365 Make Things That Matter students.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
