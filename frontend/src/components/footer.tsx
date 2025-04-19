import React from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <Sprout className="h-6 w-6 text-green-400" />
              <span className="text-xl font-bold text-green-400-dark">
                FarmWise
              </span>
            </Link>
            <p className="text-gray-600 mb-6">
              Empowering farmers with technology, subsidies, and expert advice
              to create sustainable and profitable agricultural futures.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6">
              Quick Links
            </h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-green-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="#features"
                  className="text-gray-600 hover:text-green-400 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="#about"
                  className="text-gray-600 hover:text-green-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/subsidy"
                  className="text-gray-600 hover:text-green-400 transition-colors"
                >
                  Apply for Subsidy
                </Link>
              </li>
              <li>
                <Link
                  to="/chat"
                  className="text-gray-600 hover:text-green-400 transition-colors"
                >
                  Expert Chat
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                <span className="text-gray-600">
                  123 Farm Lane, <br />
                  Agriville, CA 94107
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-green-400 mr-3" />
                <span className="text-gray-600">(123) 456-7890</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-green-400 mr-3" />
                <span className="text-gray-600">info@farmwise.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6">
              Newsletter
            </h3>
            <p className="text-gray-600 mb-4">
              Subscribe to our newsletter for the latest farming tips, subsidy
              news, and agricultural insights.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent"
              />
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} FarmWise. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
