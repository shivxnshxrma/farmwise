import React from "react";
import { CheckCircle, Leaf } from "lucide-react";

const benefits = [
  "Increased approval rates for agricultural subsidies",
  "24/7 expert farming advice and support",
  "Data-driven insights for better crop management",
  "Sustainable farming techniques and resources",
  "Community of like-minded farmers for knowledge sharing",
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Image side */}
          <div className="lg:w-1/2 animate-fade-in-up">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary rounded-full opacity-20"></div>
              <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-farm-yellow rounded-full opacity-20"></div>

              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://eos.com/wp-content/uploads/2020/02/checking-plant-using-technologies.jpg.webp"
                  alt="Farmers using technology"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>
          </div>

          {/* Content side */}
          <div
            className="lg:w-1/2 space-y-6 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-light text-green-400 font-medium text-sm">
              <Leaf className="h-4 w-4 mr-2" />
              <span>Our Mission</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
              Empowering Farmers with{" "}
              <span className="text-green-400">Technology</span>
            </h2>

            <p className="text-gray-600">
              At FarmWise, we believe that modern technology should be
              accessible to all farmers, regardless of farm size. Our platform
              combines agricultural expertise with cutting-edge technology to
              help farmers increase productivity, secure subsidies, and
              implement sustainable practices.
            </p>

            <div className="space-y-3 mt-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="ml-3 text-gray-600">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                  alt="John Doe"
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">John Doe</p>
                  <p className="text-sm text-gray-500">Founder, FarmWise</p>
                </div>
              </div>
              <p className="italic text-gray-600 mt-3">
                "Our goal is to bridge the gap between traditional farming
                wisdom and modern technology to create a more sustainable and
                profitable agricultural future."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
