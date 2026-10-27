import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://statskg.night.enkiduck.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "STATS.KG — статистика жизни в Кыргызстане",
    template: "%s — STATS.KG",
  },
  description:
    "Что происходит на рынках Кыргызстана: автомобили, недвижимость, аренда и курс доллара — простыми цифрами, с открытой методикой.",
  openGraph: {
    title: "STATS.KG — статистика жизни в Кыргызстане",
    description:
      "Автомобили × недвижимость: медианные цены, спрос, доходность аренды и другие цифры о жизни в Кыргызстане.",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="antialiased">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">{children}</main>
            <footer className="border-t">
              <div className="mx-auto w-full max-w-6xl p-4 text-sm text-muted-foreground md:p-6">
                Все цифры — из открытых объявлений mashina.kg и lalafo.kg, агрегированные и
                обновляемые ежечасно. Независимый проект, не связанный с площадками. Как
                считаем — на странице «Методика».
              </div>
            </footer>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
