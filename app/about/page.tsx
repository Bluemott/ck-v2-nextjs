import SimpleImage from '../components/SimpleImage';

const AboutPage = () => {
  return (
    <div className="min-h-screen w-full relative">
      <SimpleImage
        src="/images/CK_Web_Head_Under_Construction.jpg"
        alt="Cowboy Kimonos Under Construction"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
};

export default AboutPage;
