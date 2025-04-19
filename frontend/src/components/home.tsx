import AboutSection from "./AboutSection";
import CTASection from "./CTASection";
import FeaturesSection from "./FeaturesSection";
import FooterSection from "./footer";
import HeroSection from "./hero";
import LandingNavbar from "./navbar";
import TestimonialsSection from "./testiminols";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AboutSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
};

export default LandingPage;
