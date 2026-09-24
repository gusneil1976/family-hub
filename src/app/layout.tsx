import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePalette } from "@/lib/palettes";
import { Providers } from "@/lib/client/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Family Hub",
  description: "Family meal voting and more.",
};

// Read once and cached (refreshed by setColorPalette via revalidateTag) rather
// than per request with the visitor's cookies — that kept every page from being
// served ready-made. The palette is the same for everyone, so no cookies needed.
const getPalette = unstable_cache(
  async () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { data } = await createAdminClient()
      .from("hub_settings")
      .select("color_palette")
      .eq("id", 1)
      .single();
    return (data?.color_palette as string | undefined) ?? null;
  },
  ["hub-palette"],
  { tags: ["hub-palette"], revalidate: 3600 },
);

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const palette = resolvePalette(await getPalette());

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={palette.vars as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
