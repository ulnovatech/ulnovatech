import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Rainbow = () => {
  const [activeTab, setActiveTab] = useState('frontend');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    service: '',
    budget: '',
    message: '',
    timeline: '1-3 months'
  });

  const services = [
    {
      id: 'frontend',
      title: 'Frontend Development',
      icon: '💻',
      description: 'Modern, responsive web interfaces that engage users',
      technologies: ['React', 'Next.js', 'TypeScript', 'Vue.js', 'Tailwind CSS'],
      features: [
        'Responsive Design',
        'Component Libraries',
        'Performance Optimization',
        'Cross-browser Compatibility'
      ]
    },
    {
      id: 'backend',
      title: 'Backend Development',
      icon: '⚙️',
      description: 'Scalable server-side solutions with robust APIs',
      technologies: ['Node.js', 'Python', 'PHP', 'Ruby', 'Go'],
      features: [
        'RESTful APIs',
        'Database Design',
        'Authentication Systems',
        'Scalable Architecture'
      ]
    },
    {
      id: 'fullstack',
      title: 'Full-Stack Development',
      icon: '🔗',
      description: 'Complete solutions from database to user interface',
      technologies: ['MERN Stack', 'MEAN Stack', 'LAMP Stack', 'Django + React'],
      features: [
        'End-to-End Development',
        'Database Integration',
        'API Development',
        'Deployment & Hosting'
      ]
    },
    {
      id: 'mobile',
      title: 'Mobile App Development',
      icon: '📱',
      description: 'Native and cross-platform mobile applications',
      technologies: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin'],
      features: [
        'iOS & Android Apps',
        'Cross-Platform Solutions',
        'Push Notifications',
        'Offline Functionality'
      ]
    },
    {
      id: 'uiux',
      title: 'UI/UX Design',
      icon: '🎨',
      description: 'User-centered design that converts visitors to customers',
      technologies: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Principle'],
      features: [
        'Wireframing & Prototyping',
        'User Research',
        'Visual Design',
        'Design Systems'
      ]
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/developer-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Thank you! We\'ll review your requirements and get back to you within 24 hours.');
        setFormData({
          name: '',
          email: '',
          company: '',
          service: '',
          budget: '',
          message: '',
          timeline: '1-3 months'
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full mb-6">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Lightning Fast Development • Expert Team • Scalable Solutions</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Custom Development
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              That Drives Results
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Need help with custom development? We have a team of experienced software engineers 
            specializing in both Backend and Frontend development. From startups to enterprises, 
            we build solutions that scale.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/order"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Start Your Project
            </Link>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg border-2 border-blue-600"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Free Consultation
            </button>
          </div>
        </section>

        {/* Services Grid */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Expertise</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We specialize in modern technologies and proven development practices to deliver exceptional results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {services.map((service) => (
              <div
                key={service.id}
                className={`group cursor-pointer rounded-xl p-6 transition-all duration-300 ${
                  activeTab === service.id
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg'
                    : 'bg-white border border-gray-200 hover:shadow-md hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(service.id)}
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-3xl">{service.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600">{service.description}</p>
                  </div>
                  {activeTab === service.id && (
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">Key Features</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Service Details */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {services.find(s => s.id === activeTab)?.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {services.find(s => s.id === activeTab)?.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Timeline</h4>
                    <p className="text-sm text-blue-700">2-8 weeks depending on complexity</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Starting At</h4>
                    <p className="text-sm text-green-700">UGX 1,500,000</p>
                  </div>
                </div>
                
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Free initial consultation and requirements analysis</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Agile development with regular progress updates</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Comprehensive testing and quality assurance</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Deployment and post-launch support</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
                  <h4 className="text-lg font-semibold mb-3">Ready to Build?</h4>
                  <p className="text-blue-100 mb-4">Get your project started today</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Phone:</span>
                      <span className="font-semibold">+256 772 169 960</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email:</span>
                      <span className="font-semibold">ulnovatech@gmail.com</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Recent Projects</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>E-commerce Platform</span>
                      <span className="text-green-600">Completed</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SaaS Dashboard</span>
                      <span className="text-blue-600">In Progress</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mobile Banking App</span>
                      <span className="text-purple-600">Planning</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Form */}
        <section className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Your Free Quote</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Tell us about your project and we'll provide a detailed proposal within 24 hours
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your company (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Needed *</label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a service</option>
                  <option value="frontend">Frontend Development</option>
                  <option value="backend">Backend Development</option>
                  <option value="fullstack">Full-Stack Development</option>
                  <option value="mobile">Mobile App Development</option>
                  <option value="uiux">UI/UX Design</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select budget range</option>
                  <option value="under-1m">Under UGX 1,000,000</option>
                  <option value="1m-3m">UGX 1M - 3M</option>
                  <option value="3m-10m">UGX 3M - 10M</option>
                  <option value="over-10m">Over UGX 10M</option>
                  <option value="discuss">Let's discuss</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline *</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="1-3 months">1-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="urgent">ASAP (under 1 month)</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Details *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your project requirements, goals, and any specific features you need..."
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!formData.name || !formData.email || !formData.service || !formData.message}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Get Your Free Quote
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 text-center">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-gray-600">Projects Delivered</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
            <div className="text-gray-600">Client Satisfaction</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-green-600 mb-2">24h</div>
            <div className="text-gray-600">Response Time</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-indigo-600 mb-2">100%</div>
            <div className="text-gray-600">On-Time Delivery</div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-12 rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Idea into Reality?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Our team is ready to partner with you on your next big project. Let's create something amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="mailto:ulnovatech@gmail.com"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Us Now
              </a>
              <a
                href="tel:+256772169960"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call +256 772 169 960
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Rainbow;