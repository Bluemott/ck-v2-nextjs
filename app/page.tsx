import Image from "next/image";
import { Metadata } from "next";
import { generateSEOMetadata } from "./lib/seo";
import HomeBlogCards from "./components/HomeBlogCards";

export const metadata: Metadata = generateSEOMetadata({
  title: "",
  description: "Welcome to Cowboy Kimono - Discover unique handcrafted western-inspired robes and apparel that blend Eastern elegance with Western spirit. Shop our exclusive collection of artistic kimonos, robes, and accessories. Featured: Latest blog posts and updates.",
  keywords: ["handcrafted kimonos", "western robes", "artistic apparel", "unique fashion", "cowboy style", "latest posts", "blog updates"],
  canonical: "/",
});

export default function Home() {
  return (
    <>
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] mt-16">
        <Image
          src="/images/CK_New_Hero_Red_Head-1.webp"
          alt="Hero Image"
          fill
          style={{ objectFit: "cover", objectPosition: "left" }}
          priority
          sizes="100vw"
          quality={85}
        />
      </div>

      <section className="flex flex-col lg:flex-row items-center justify-evenly py-16 px-8 bg-white gap-x-8">
        {/* Circular Image */}
        <div className="w-96 h-96 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0">
          <Image
            src="/images/Paint_application_CU.webp"
            alt="Circular Image"
            width={384}
            height={384}
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 100vw, 384px"
            quality={85}
          />
        </div>

        {/* Paragraphs */}
        <div className="ml-0 mt-12 lg:mt-0 space-y-6 max-w-2xl text-xl text-gray-800">
          <h1 className="serif text-3xl md:text-4xl font-bold">Not My First Hand Painted Jacket</h1>
          <p>I&apos;m Marisa Mott, the artist behind Cowboy Kimonos—hand-painted, recycled denim jackets that blend art, sustainability, and cultural tradition. My journey began in 1997, making hand-painted jackets as gifts for friends and family. What started as a personal project grew into a passion for transforming everyday denim into vibrant works of art that help keep waste out of landfills.</p>
          <p>As an illustrator, I&apos;m inspired by global textile traditions and symbolic designs. This passion led me to create one-of-a-kind pieces that combine bold imagery, historic patterns, and creativity. Each Cowboy Kimono is more than just clothing—it&apos;s a canvas for stories, a conversation starter, and a timeless piece of wearable art.</p>
          <p>I believe clothing should express individuality, and with every jacket I design, I aim to offer something unique—an art piece you&apos;ll wear and love for years.</p>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="py-12 px-8 bg-[#f0f8ff]">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/CK_Logo_Titles_NewCowboyKimono.webp"
              alt="A New Kimono in Town."
              width={2551}
              height={567}
              className="max-w-full h-auto"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              quality={85}
            />
          </div>
          <HomeBlogCards />
        </div>
      </section>
    </>
  );
}
