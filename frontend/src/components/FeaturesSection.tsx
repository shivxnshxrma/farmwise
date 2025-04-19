import React from "react";
import {
  Sprout,
  FileSpreadsheet,
  MessageSquare,
  BarChart4,
  CloudSun,
  DollarSign,
} from "lucide-react";

const features = [
  {
    icon: <FileSpreadsheet className="h-6 w-6 text-green-400" />,
    title: "Subsidy Applications",
    description:
      "Streamlined agricultural subsidy applications with expert guidance and high approval rates.",
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-green-400" />,
    title: "Expert Chat",
    description:
      "Connect with agricultural experts to get answers to your farming questions 24/7.",
  },
  {
    icon: <BarChart4 className="h-6 w-6 text-green-400" />,
    title: "Yield Analysis",
    description:
      "Data-driven insights to maximize your crop yields and optimize farm operations.",
  },
  {
    icon: <CloudSun className="h-6 w-6 text-green-400" />,
    title: "Weather Integration",
    description:
      "Real-time weather forecasts and alerts tailored to your specific farming location.",
  },
  {
    icon: <DollarSign className="h-6 w-6 text-green-400" />,
    title: "Financial Planning",
    description:
      "Tools to help manage farm finances, track expenses, and plan for future growth.",
  },
  {
    icon: <Sprout className="h-6 w-6 text-green-400" />,
    title: "Sustainable Practices",
    description:
      "Guidance on implementing eco-friendly and sustainable farming techniques.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-primary-light/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Comprehensive Farming Solutions
          </h2>
          <p className="text-gray-600">
            FarmWise provides an all-in-one platform to help modern farmers
            thrive with technology-driven solutions and expert support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-primary-light/50 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
