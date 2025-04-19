import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section id="contact" className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-2/3 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Ready to transform your farming operations?
            </h2>
            <p className="text-white/80 text-lg max-w-xl">
              Join thousands of farmers who have optimized their operations and
              secured crucial funding through FarmWise.
            </p>
          </div>

          <div className="md:w-1/3 flex flex-col sm:flex-row md:flex-col space-y-4 sm:space-y-0 md:space-y-4 sm:space-x-4 md:space-x-0">
            <Link to="/subsidy">
              <Button
                size="lg"
                className="w-full bg-white text-green-400 hover:bg-gray-100"
              >
                Apply for Subsidy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/chat">
              <Button
                size="lg"
                // variant="outline"
                className="w-full bg-white text-green-400 hover:bg-gray-100"
              >
                Chat with Expert
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
