import SimpleImage from "./components/SimpleImage";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
        <SimpleImage
          src="/images/Ck_New_Hero_Red_Head-1.webp"
          alt="Hero Image"
          fill
          objectFit="cover"
          priority
        />
      </div>

      <section className="flex flex-col lg:flex-row items-center justify-evenly py-16 px-8 bg-[#FFEBCD]">
        {/* Circular Image */}
        <div className="w-80 h-80 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0">
          <SimpleImage
            src="/images/Paint_application_CU.png"
            alt="Circular Image"
            width={320}
            height={320}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Paragraphs */}
        <div className="ml-0 mt-12 lg:mt-0 space-y-6 max-w-2xl text-xl text-gray-800">
          <p>I’m Marisa Mott, the artist behind Cowboy Kimonos—hand-painted, recycled denim jackets that blend art, sustainability, and cultural tradition. My journey began in 1997, making hand-painted jackets as gifts for friends and family. What started as a personal project grew into a passion for transforming everyday denim into vibrant works of art that help keep waste out of landfills.</p>
          <p>As an illustrator, I’m inspired by global textile traditions and symbolic designs. This passion led me to create one-of-a-kind pieces that combine bold imagery, historic patterns, and creativity. Each Cowboy Kimono is more than just clothing—it’s a canvas for stories, a conversation starter, and a timeless piece of wearable art.</p>
          <p>I believe clothing should express individuality, and with every jacket I design, I aim to offer something unique—an art piece you’ll wear and love for years.</p>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="py-12 px-8 bg-[#f0f8ff]">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-8">
            <SimpleImage
              src={"/images/CK_Logo_Title-01.webp"}
              alt="A New Kimono in Town."
              width={800}
              height={178}
              className="max-w-full h-auto"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Blog Post 1 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square relative">
                <SimpleImage
                  src="/images/Little_Dino_Work_Table.jpg"
                  alt="Dino Jacket"
                  fill
                  objectFit="cover"
                  className="rounded-t-lg"
                />
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">Dino Jacket</p>
                <Link href="/blog/post-1" legacyBehavior>
                  <a className="text-blue-600 hover:text-blue-800 font-medium">Read More →</a>
                </Link>
              </div>
            </div>

            {/* Blog Post 2 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square relative">
                <SimpleImage
                  src="/images/CK_Shop_Images_PoodoodleBrown.jpg"
                  alt="Poodoodle Dot Grid Journal (Brown)"
                  fill
                  objectFit="cover"
                  className="rounded-t-lg"
                />
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">Poodoodle Dot Grid Journal (Brown)</p>
                <Link href="/blog/post-2" legacyBehavior>
                  <a className="text-blue-600 hover:text-blue-800 font-medium">Read More →</a>
                </Link>
              </div>
            </div>

            {/* Blog Post 3 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square relative">
                <SimpleImage
                  src="/images/Green_Velvet_Model_SQ.jpg"
                  alt="Green Velvet Skirt"
                  fill
                  objectFit="cover"
                  className="rounded-t-lg"
                />
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">Green Velvet Skirt</p>
                <Link href="/blog/post-3" legacyBehavior>
                  <a className="text-blue-600 hover:text-blue-800 font-medium">Read More →</a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
