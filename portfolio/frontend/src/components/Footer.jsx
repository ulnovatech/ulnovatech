import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">UlnovaTech</h3>
            <p className="text-gray-400 mb-4">
              Website, App & System development • IT services
            </p>
            <div className="space-y-2 text-gray-400">
              <p>Kampala, Uganda</p>
              <p>Phone: +256 772169960</p>
              <p>Email: ulnovatech@gmail.com</p>
              <p className="italic">“Address coming soon. Office under development”</p>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Useful Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About us</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy policy</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/web-design" className="hover:text-white transition-colors">Web Design</Link></li>
              <li><Link to="/web-development" className="hover:text-white transition-colors">Web Development</Link></li>
              <li><Link to="/product-management" className="hover:text-white transition-colors">Product Management</Link></li>
              <li><Link to="/marketing" className="hover:text-white transition-colors">Marketing</Link></li>
              <li><Link to="/graphic-design" className="hover:text-white transition-colors">Graphic Design</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-4">Our Newsletter</h4>
            <p className="text-gray-400 mb-6">
              Subscribe to our newsletter and receive the latest news about our products and services!
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center border-t border-gray-800 pt-6">
          <p className="text-gray-400">
            © 2025 Copyright UlnovaTech All Rights Reserved
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            Designed by <Link to="/" className="underline hover:text-white">UlnovaTech</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;