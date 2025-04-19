import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    content:
      "FarmWise helped me secure a crucial subsidy that transformed my farm's irrigation system. The application process was straightforward, and their team provided excellent guidance.",
    author: "Michael Johnson",
    role: "Wheat Farmer, Iowa",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
  },
  {
    id: 2,
    content:
      "The expert chat feature has been a game-changer for our organic farm. We got immediate answers during a pest crisis that saved our entire crop this season.",
    author: "Sarah Williams",
    role: "Organic Farmer, California",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
  },
  {
    id: 3,
    content:
      "As a new farmer, navigating subsidies seemed overwhelming until I found FarmWise. Their platform simplified everything, and I received my first subsidy within weeks.",
    author: "Robert Chen",
    role: "New Farmer, Oregon",
    avatar: "https://randomuser.me/api/portraits/men/62.jpg",
    rating: 4,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-farm-beige">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Trusted by Farmers Nationwide
          </h2>
          <p className="text-gray-600">
            Hear from the farming community about how FarmWise has helped
            transform their agricultural operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in-up relative"
              style={{ animationDelay: `${testimonial.id * 0.1}s` }}
            >
              {/* Quotation mark */}
              <div className="absolute -top-4 -left-4 bg-primary text-white w-8 h-8 flex items-center justify-center rounded-full text-xl font-bold">
                "
              </div>

              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? "text-farm-yellow fill-farm-yellow"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-600 mb-6">{testimonial.content}</p>

              {/* Author */}
              <div className="flex items-center mt-auto">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="h-12 w-12 rounded-full object-cover border-2 border-farm-green-light"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-800">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
