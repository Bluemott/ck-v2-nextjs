import type { Metadata } from 'next';
import Image from 'next/image';
import { generateSEOMetadata } from '../lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Customize',
  description:
    'Create your own personalized handpainted denim jackets with Cowboy Kimono. Work with artist Marisa Mott to design bespoke, hand-painted denim jackets that tell your story.',
  keywords: [
    'customize',
    'personalized kimonos',
    'western fashion',
    'handpainted denim',
    'custom design',
    'bespoke kimonos',
    'handpainted jackets',
    'custom clothing',
    'hand-painted denim',
    'marisa mott',
    'artist collaboration',
  ],
  canonical: '/custom-kimonos',
  ogImage: '/images/Marisa_Young_Hat.webp',
});

export default function CustomKimonosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c5e8f9] to-white pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <Image
              src="/images/CK_Logo_Title_Deck_OUT.png"
              alt="Customize - Create your own personalized western kimonos"
              width={800}
              height={400}
              className="w-full h-auto object-contain"
              priority
              quality={90}
            />
          </div>
        </div>

        {/* Description Text Box */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg shadow-lg p-8 mb-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <p className="text-gray-800 text-lg leading-relaxed">
              Do you have a favorite denim jacket that fits like a dream and is
              worn in all the right places? Let&apos;s talk and develop a plan
              to take your denim from dull to dandy. We can start by picking
              your paint spaces: front, back, sleeves, cuffs, yokes, pockets,
              etc... Next, define your style: favorite fashion trend,
              inspirational art movement, cultural fascinations, etc...
            </p>
            <p className="text-gray-800 text-lg leading-relaxed">
              I&apos;ll create a sketch based on our conversation and send it to
              you for feedback.
            </p>
            <p className="text-gray-800 text-lg leading-relaxed">
              Every Cowboy Kimono is unique—just like the style trailblazer
              wearing it. Pricing depends on the size, style, and detail of your
              project, and I&apos;ll wrangle up a fair estimate once we&apos;ve
              mapped out the plan.
            </p>
          </div>
        </div>

        {/* Main Content Area - Contact Information */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg shadow-lg p-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-700">
            <h2 className="text-2xl font-semibold mb-6">
              Ready to Gussy Up Your Garb?
            </h2>
            <div className="text-lg mb-8 max-w-2xl mx-auto space-y-2">
              <p>Pick your paint spots.</p>
              <p>Name your style.</p>
              <p>I&apos;ll wrangle the rest.</p>
            </div>
            <a
              href="mailto:marisa@cowboykimono.com"
              className="inline-block bg-[#8B4513] hover:bg-[#A0522D] text-white font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:ring-opacity-50 focus:ring-offset-2"
              aria-label="Send email to marisa@cowboykimono.com for custom kimono inquiries"
            >
              Get in Touch
            </a>

            {/* Gallery Section */}
            <div className="mt-12 max-w-4xl mx-auto">
              <h3 className="text-2xl font-semibold mb-8 text-center text-gray-800">
                Denim Overhauls
              </h3>

              {/* Rotating Cards Container */}
              <div className="relative overflow-hidden">
                <div className="flex space-x-6 animate-scroll">
                  {/* Card 1 - Catherine's Jacket */}
                  <div className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src="/images/Catherine's_Jacket_custom_page.webp"
                      alt="Catherine's custom painted jacket"
                      width={256}
                      height={320}
                      className="w-full h-full object-cover"
                      quality={85}
                    />
                  </div>

                  {/* Card 2 - Diane's Jacket */}
                  <div className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src="/images/Diane's_Jacket_custom_page.webp"
                      alt="Diane's custom painted jacket"
                      width={256}
                      height={320}
                      className="w-full h-full object-cover"
                      quality={85}
                    />
                  </div>

                  {/* Card 3 - Doreen's Mom Jacket */}
                  <div className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src="/images/Doreen's MomJacket_custom_page.webp"
                      alt="Doreen's Mom custom painted jacket"
                      width={256}
                      height={320}
                      className="w-full h-full object-cover"
                      quality={85}
                    />
                  </div>

                  {/* Card 4 - E McD Sleeve */}
                  <div className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src="/images/E_McD_Sleeve_custom_page.webp"
                      alt="E McD custom painted sleeve detail"
                      width={256}
                      height={320}
                      className="w-full h-full object-cover"
                      quality={85}
                    />
                  </div>

                  {/* Card 5 - Mosaic Athena */}
                  <div className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src="/images/Mosaic_Athena_custom_page.webp"
                      alt="Mosaic Athena custom painted jacket"
                      width={256}
                      height={320}
                      className="w-full h-full object-cover"
                      quality={85}
                    />
                  </div>

                  {/* Duplicate cards for seamless loop */}
                  <div className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src="/images/Catherine's_Jacket_custom_page.webp"
                      alt="Catherine's custom painted jacket"
                      width={256}
                      height={320}
                      className="w-full h-full object-cover"
                      quality={85}
                    />
                  </div>

                  <div className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src="/images/Diane's_Jacket_custom_page.webp"
                      alt="Diane's custom painted jacket"
                      width={256}
                      height={320}
                      className="w-full h-full object-cover"
                      quality={85}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Section with Circular Photo Placeholder and Paragraphs */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg shadow-lg p-8 mb-8 mt-16">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Photo */}
            <div className="flex-shrink-0">
              <Image
                src="/images/Marisa_Young_Hat.webp"
                alt="Marisa Young wearing a hat"
                width={192}
                height={240}
                className="max-w-full h-auto object-contain"
                priority
                quality={85}
              />
            </div>

            {/* Content Area for Paragraphs */}
            <div className="flex-1 space-y-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                I&apos;m Marisa Mott, the artist wrestling paintbrushes and
                secondhand denim into one-of-a-kind creations.
              </p>
              <p className="text-gray-800 text-lg leading-relaxed">
                Cowboy Kimonos started with a little fashion identity
                crisis—desert roots, a sailor-suited childhood, and a lifelong
                love of reinvention. Today, it&apos;s my way of turning everyday
                jackets into personal art pieces you&apos;ll wear and love for
                years.
              </p>
              <p className="text-gray-800 text-lg leading-relaxed">
                I work with recycled denim (because this planet deserves some
                love, too), then hand-paint each jacket into a showpiece—pulling
                from art, culture, and a dash of rhinestone-cowboy envy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
