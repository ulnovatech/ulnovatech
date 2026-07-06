import React from 'react';
import { Link } from 'react-router-dom';

const PricingCard = ({ title, price, features, popular = false }) => {
  return (
    <div className={`relative bg-white rounded-lg shadow-md p-8 transform transition-all duration-300 ${
      popular ? 'ring-2 ring-blue-500 ring-opacity-20 scale-105' : 'hover:scale-105'
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
        <div className="text-3xl font-bold text-blue-600 mb-1">{price}</div>
        <div className="text-gray-500 mb-8">(Negotiable)</div>
        
        <ul className="space-y-3 mb-8 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        
        <div className="space-y-2">
          <Link
            to="/order"
            className={`block w-full py-3 rounded-lg font-semibold text-center transition-colors duration-200 ${
              popular 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            View Details
          </Link>
          <Link
            to="/order"
            className={`block w-full py-3 rounded-lg font-semibold text-center transition-colors duration-200 border ${
              popular 
                ? 'bg-white text-blue-600 hover:bg-blue-50 border-blue-600' 
                : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
            }`}
          >
            Choose Plan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;