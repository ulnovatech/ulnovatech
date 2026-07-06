import React, { useState } from 'react';

const faqData = [
  {
    question: "What Services Does UlnovaTech Offer?",
    answer: "We provide a range of I.T. services, including: Website development, Web App Development, UI/UX Design, Mobile App Development, Software Applications Development, Pitch Deck Design, Dashboard UI Design, SEO & Performance Optimization"
  },
  {
    question: "I Don't Have a Design, Can You Build It for Me?",
    answer: "Absolutely! Our creative professionals are skilled in crafting visually stunning and user-friendly designs, whether you need a logo, website, or any other digital asset. We'll work collaboratively with you to bring your brand to life."
  },
  {
    question: "Do You Offer Custom Solutions?",
    answer: "Yes, we provide customized software solutions to align with your business goals and requirements. That's how we help your business grow."
  },
  {
    question: "Do I really need a website for myself or my business?",
    answer: "Simple answer. Yes you Do."
  },
  {
    question: "How long does it take to develop a website?",
    answer: "The timeline varies based on the project scope, but a typical website can take 1 to 4 weeks. A custom website can take 4 to 12 weeks. Our team however ensures that you receive the best product, in the most suitable time possible to avoid long waiting times and of course, losing your money."
  },
  {
    question: "How much does it cost to design a website?",
    answer: "The cost really depends on what you need your website to do. On average, website prices can range from a UGX 300,000 to millions of shillings based on custom features, integrations, or special designs. The best way to know your cost is to request a free estimate based on your exact needs."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">FAQ</h2>
          <p className="text-xl text-gray-600">Some Questions For Our Clients</p>
          <p className="text-gray-500 mt-2">Quick answers about our design & SEO services. Click a question to reveal the details.</p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12 space-x-4 space-y-4 sm:space-y-0">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200">
            Start a Project
          </button>
          <button className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200">
            See Case Studies
          </button>
          <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200">
            Free Site Check
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;