import Image from "next/image";
import { Metadata } from "next";
import { generateSEOMetadata } from "./lib/seo";
import HomeBlogCards from "./components/HomeBlogCards";
import GTMTest from "./components/GTMTest";

export const metadata: Metadata = generateSEOMetadata({
  title: "",
  description: "Welcome to Cowboy Kimono - Discover unique handcrafted western-inspired robes and apparel that blend Eastern elegance with Western spirit. Shop our exclusive collection of artistic kimonos, robes, and accessories. Featured: Latest blog posts and updates.",
  keywords: ["handcrafted kimonos", "western robes", "artistic apparel", "unique fashion", "cowboy style", "latest posts", "blog updates"],
  canonical: "/",
});

export default function Home() {
  return (
    <main>
      <GTMTest />
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <Image
          src="/images/CK_New_Hero_Red_Head-1.webp"
          alt="Cowboy Kimono Hero"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={85}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 serif">
              Cowboy Kimono
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Handcrafted Western Robes
            </p>
            <button className="bg-[#1e2939] hover:bg-[#2a3441] text-white px-8 py-3 rounded-lg text-lg transition-colors">
              Shop Now
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-[#FFEBCD]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 serif">About Us</h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg mb-6">
              Discover unique handcrafted cowboy kimonos that blend Western and Eastern aesthetics. 
              Each piece is carefully crafted with attention to detail and artistic flair.
            </p>
            <p className="text-lg">
              From our signature robes to custom designs, we bring you premium quality apparel 
              that celebrates the spirit of the West with timeless elegance.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16 bg-[#f0f8ff]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 serif">Latest from Our Blog</h2>
          <HomeBlogCards />
        </div>
      </section>
    </main>
  );
}
