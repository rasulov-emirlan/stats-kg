import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
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

const NAV = [
  { href: "/", label: "Пульс" },
  { href: "/glubzhe", label: "Глубже" },
  { href: "/metodika", label: "Методика" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <header className="border-b border-g300">
          <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-6 px-4 py-4">
            <Link href="/" className="font-heading text-lg font-bold tracking-tight">
              STATS<span className="text-red">.</span>KG
            </Link>
            <nav className="flex gap-5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="kicker text-g500 transition-colors duration-150 hover:text-red"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-20 bg-ink text-paper">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <p className="kicker text-g500">{"// источники"}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-10">
              <a
                href="https://avtostat.kg"
                className="font-heading font-medium transition-colors duration-150 hover:text-red"
              >
                Автостат — рынок автомобилей →
              </a>
              <a
                href="https://stats.kg"
                className="font-heading font-medium transition-colors duration-150 hover:text-red"
              >
                Недвижимость и аренда →
              </a>
            </div>
            <p className="mt-6 max-w-[70ch] text-sm text-g500">
              Все цифры — из открытых объявлений mashina.kg и lalafo.kg, агрегированные и
              обновляемые ежедневно. Это независимый проект, не связанный с площадками.
              Как считаем — на странице «Методика».
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
