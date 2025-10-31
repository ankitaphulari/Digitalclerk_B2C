import { Zap, Shield, Clock, TrendingUp, CheckCircle, Chrome, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Homepage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Fill forms 120x faster. What took 30 minutes now takes 15 seconds.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored securely on Indian servers.'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Save 25+ hours per week on repetitive form filling tasks.'
    },
    {
      icon: TrendingUp,
      title: 'Boost Productivity',
      description: 'Focus on your core business while we handle the paperwork.'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Upload Document',
      description: 'Simply upload any document like PAN card, Aadhaar, or GST certificate.'
    },
    {
      step: 2,
      title: 'AI Extracts Data',
      description: 'Our advanced OCR technology extracts all relevant information automatically.'
    },
    {
      step: 3,
      title: 'Auto-Fill Forms',
      description: 'Forms are filled instantly with 99.9% accuracy across any website.'
    }
  ];

  const useCases = [
    'GST Registration',
    'Income Tax Returns',
    'PAN Card Applications',
    'Bank Account Opening',
    'Company Registration',
    'TDS Returns',
    'Import/Export Forms',
    'Government Portals'
  ];

  // Button handlers
  const handleDownloadExtension = () => {
    // For now, navigate to signup. Later, link to Chrome Web Store
    window.open('https://chrome.google.com/webstore', '_blank');
  };

  const handleWatchDemo = () => {
    // Navigate to demo or dashboard
    navigate('/demo');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleStartTrial = () => {
    navigate('/signup');
  };

  const handleBookDemo = () => {
    // Could open a calendar or contact form
    window.location.href = 'mailto:support@digitalclerk.app?subject=Book a Demo';
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DigitalClerk</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} className="text-gray-600 hover:text-blue-600 cursor-pointer">Features</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }} className="text-gray-600 hover:text-blue-600 cursor-pointer">How It Works</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="text-gray-600 hover:text-blue-600 cursor-pointer">Pricing</a>
            <button onClick={handleLogin} className="text-blue-600 hover:text-blue-700 font-semibold">Login</button>
            <button onClick={handleStartTrial} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Fill Forms in <span className="text-blue-600">15 Seconds</span> Not 30 Minutes
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Upload any document, and our AI instantly extracts data to auto-fill any form. Built for CA firms, businesses, and professionals in India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button onClick={handleDownloadExtension} className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition text-lg font-semibold flex items-center justify-center gap-2">
                  <Chrome className="w-6 h-6" />
                  Download Chrome Extension
                </button>
                <button onClick={handleWatchDemo} className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition text-lg font-semibold">
                  Watch Demo
                </button>
              </div>
              <div className="flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free 7-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-white mb-4">
                  <h3 className="text-2xl font-bold mb-2">Save 25+ Hours/Week</h3>
                  <p className="text-blue-100">Join 1,000+ CA firms and businesses</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Time to fill GST form</span>
                    <span className="font-bold text-red-600">30 min → 15 sec</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Accuracy rate</span>
                    <span className="font-bold text-green-600">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Forms filled today</span>
                    <span className="font-bold text-blue-600">15,847</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose DigitalClerk?</h2>
            <p className="text-xl text-gray-600">The smartest way to handle Indian government and business forms</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="text-center p-6 rounded-xl hover:shadow-lg transition">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to transform your workflow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {item.step < 3 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 text-blue-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Works with Every Indian Form</h2>
            <p className="text-xl text-gray-600">From GST to Income Tax, we support all major forms</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center font-semibold text-gray-700 hover:shadow-md transition">
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Save 25+ Hours Every Week?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of CA firms and businesses already using DigitalClerk</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleStartTrial} className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition text-lg font-semibold">
              Start Free Trial
            </button>
            <button onClick={handleBookDemo} className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 transition text-lg font-semibold">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">DigitalClerk</h3>
            <p className="text-sm">Automate Indian form filling with AI-powered data extraction.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white cursor-pointer">Features</a></li>
              <li><a href="/pricing" className="hover:text-white cursor-pointer">Pricing</a></li>
              <li><a href="#" onClick={handleDownloadExtension} className="hover:text-white cursor-pointer">Chrome Extension</a></li>
              <li><a href="#" className="hover:text-white cursor-pointer">API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white cursor-pointer">About Us</a></li>
              <li><a href="mailto:support@digitalclerk.app" className="hover:text-white cursor-pointer">Contact</a></li>
              <li><a href="#" className="hover:text-white cursor-pointer">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white cursor-pointer">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white cursor-pointer">Help Center</a></li>
              <li><a href="#" className="hover:text-white cursor-pointer">Documentation</a></li>
              <li><a href="mailto:support@digitalclerk.app" className="hover:text-white cursor-pointer">support@digitalclerk.app</a></li>
              <li><a href="tel:+919876543210" className="hover:text-white cursor-pointer">+91 98765 43210</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>© 2024 DigitalClerk. All rights reserved. Made in India 🇮🇳</p>
        </div>
      </footer>
    </div>
  );
}
