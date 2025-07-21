import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { generateSEOMetadata } from "./lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Home",
  description: "Welcome to Cowboy Kimono - Discover unique handcrafted western-inspired robes and apparel that blend Eastern elegance with Western spirit. Shop our exclusive collection of artistic kimonos, robes, and accessories. Featured: T-Rex fashion crisis, Poodoodle journals, and 70s velvet skirts.",
  keywords: ["handcrafted kimonos", "western robes", "artistic apparel", "unique fashion", "cowboy style", "dino jacket", "poodoodle journal", "velvet skirt", "70s fashion"],
  canonical: "/",
});

export default function Home() {
  return (
    <>
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
        <Image
          src="/images/CK_New_Hero_Red_Head-1.webp"
          alt="Hero Image"
          fill
          style={{ objectFit: "cover", objectPosition: "left" }}
          priority
          sizes="100vw"
        />
      </div>

      <section className="flex flex-col lg:flex-row items-center justify-evenly py-16 px-8 bg-white gap-x-8">
        {/* Circular Image */}
        <div className="w-96 h-96 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0">
          <Image
            src="/images/Paint_application_CU.png"
            alt="Circular Image"
            width={384}
            height={384}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Paragraphs */}
        <div className="ml-0 mt-12 lg:mt-0 space-y-6 max-w-2xl text-xl text-gray-800">
          <h1 className="serif text-3xl md:text-4xl font-bold">Not My First Hand Painted Jacket</h1>
          <p>I’m Marisa Mott, the artist behind Cowboy Kimonos—hand-painted, recycled denim jackets that blend art, sustainability, and cultural tradition. My journey began in 1997, making hand-painted jackets as gifts for friends and family. What started as a personal project grew into a passion for transforming everyday denim into vibrant works of art that help keep waste out of landfills.</p>
          <p>As an illustrator, I’m inspired by global textile traditions and symbolic designs. This passion led me to create one-of-a-kind pieces that combine bold imagery, historic patterns, and creativity. Each Cowboy Kimono is more than just clothing—it’s a canvas for stories, a conversation starter, and a timeless piece of wearable art.</p>
          <p>I believe clothing should express individuality, and with every jacket I design, I aim to offer something unique—an art piece you’ll wear and love for years.</p>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="py-12 px-8 bg-[#f0f8ff]">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/CK_Logo_Titles_NewCowboyKimono.png"
              alt="A New Kimono in Town."
              width={2551}
              height={567}
              className="max-w-full h-auto"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Blog Post 1 - T-Rex Fashion Crisis */}
            <Link href="/blog/do-these-stripes-and-polka-dots-make-my-tail-look-big-t-rexs-fashion-crisis" className="block">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <div className="aspect-square relative">
                  <Image
                    src="/images/Little_Dino_Work_Table.jpg"
                    alt="Dino Jacket - T-Rex Fashion Crisis"
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-t-lg transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">Dino Jacket</p>
                  <span className="text-[#1e2939] hover:text-[#2a3441] font-medium">
                    Read More →
                  </span>
                </div>
              </div>
            </Link>

            {/* Blog Post 2 - Poodoodle Journal */}
            <Link href="/blog/introducing-the-poodoodle-journal" className="block">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <div className="aspect-square relative">
                  <Image
                    src="/images/CK_Shop_Images_PoodoodleBrown.jpg"
                    alt="Poodoodle Dot Grid Journal - Introducing the Poodoodle Journal"
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-t-lg transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">Poodoodle Dot Grid Journal (Brown)</p>
                  <span className="text-[#1e2939] hover:text-[#2a3441] font-medium">
                    Read More →
                  </span>
                </div>
              </div>
            </Link>

            {/* Blog Post 3 - Velvet Skirt */}
            <Link href="/blog/new-in-the-shop-a-velvet-skirt-with-some-serious-70s-mojo-2" className="block">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <div className="aspect-square relative">
                  <Image
                    src="/images/Green_Velvet_Model_SQ.jpg"
                    alt="Green Velvet Skirt - New in the Shop with 70s Mojo"
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-t-lg transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">Green Velvet Skirt</p>
                  <span className="text-[#1e2939] hover:text-[#2a3441] font-medium">
                    Read More →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
