import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Wheat, Leaf, Tractor } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative pt-16 pb-32 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-farm-pattern opacity-5 z-0"></div>

      {/* Background gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-hero-gradient z-0"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Hero Content */}
          <div className="lg:w-1/2 space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-light text-green-400 font-medium text-sm">
              <Leaf className="h-4 w-4 mr-2" />
              <span>Sustainable Farming Solutions</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
              Grow your farm with{" "}
              <span className="text-green-400">FarmWise</span> Solutions
            </h1>

            <p className="text-lg text-gray-600 max-w-lg">
              Empowering farmers with smart technology, agricultural subsidies,
              and expert advice to maximize yields and sustainability.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/subsidy">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  Apply for Subsidy
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/chat">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-farm-green text-green-400 hover:bg-primary-light"
                >
                  Chat with Expert
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-8 border-t border-gray-100 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">1000+</p>
                <p className="text-gray-600 text-sm">Farmers Helped</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">90%</p>
                <p className="text-gray-600 text-sm">Success Rate</p>
              </div>
              <div className="text-center md:block hidden">
                <p className="text-3xl font-bold text-green-400">24/7</p>
                <p className="text-gray-600 text-sm">Expert Support</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div
            className="lg:w-1/2 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-farm-yellow rounded-full opacity-20 animate-float"></div>
              <div
                className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary rounded-full opacity-20 animate-float"
                style={{ animationDelay: "1s" }}
              ></div>

              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                  alt="Sustainable farming"
                  className="w-full h-[400px] object-cover"
                />

                {/* Floating card */}
                <div
                  className="absolute -bottom-5 -right-5 bg-white p-4 rounded-lg shadow-lg border border-gray-100 max-w-[200px]"
                  style={{ marginRight: "15px", marginBottom: "15px" }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="bg-primary-light p-2 rounded-full">
                      <Tractor className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">
                        Modern Farming
                      </p>
                      <p className="text-xs text-gray-500">
                        Tech-driven solutions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating wheat icon */}
                <div
                  className="absolute -top-4 left-5 bg-white p-3 rounded-full shadow-lg border border-gray-100"
                  style={{ marginTop: "30px" }}
                >
                  <Wheat className="h-5 w-5 text-farm-yellow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
