import { Check, Zap, Building2, Rocket } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      icon: Zap,
      price: 999,
      description: 'Perfect for small teams and freelancers',
      features: [
        '100 documents per month',
        'Basic OCR extraction',
        'Email support',
        'Chrome extension access',
        '5 GB storage',
        'Standard processing speed'
      ],
      color: 'blue'
    },
    {
      name: 'Professional',
      icon: Building2,
      price: 1999,
      description: 'Ideal for growing businesses',
      features: [
        '1,000 documents per month',
        'Advanced OCR with 99% accuracy',
        'Priority support',
        'API access',
        '50 GB storage',
        'Fast processing speed',
        'Multi-user access (up to 5)',
        'Custom templates'
      ],
      color: 'indigo',
      popular: true
    },
    {
      name: 'Enterprise',
      icon: Rocket,
      price: 2999,
      description: 'For large organizations',
      features: [
        'Unlimited documents',
        'Premium OCR with AI enhancement',
        '24/7 dedicated support',
        'Full API access',
        'Unlimited storage',
        'Ultra-fast processing',
        'Unlimited users',
        'Custom integrations',
        'White-label option',
        'SLA guarantee'
      ],
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your business needs
          </p>
          <p className="text-gray-500 mt-2">
            Fill forms 120x faster • Save 25+ hours per week
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Most Popular
                  </div>
                )}

                <div className={`bg-gradient-to-br from-${plan.color}-500 to-${plan.color}-600 p-8 text-white`}>
                  <Icon className="w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-white/90 mb-4">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">₹{plan.price}</span>
                    <span className="text-white/80 ml-2">/month</span>
                  </div>
                </div>

                <div className="p-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-4 px-6 text-gray-700">Feature</th>
                  <th className="py-4 px-6 text-center text-gray-700">Starter</th>
                  <th className="py-4 px-6 text-center text-gray-700">Professional</th>
                  <th className="py-4 px-6 text-center text-gray-700">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-6 font-medium">Documents/month</td>
                  <td className="py-4 px-6 text-center">100</td>
                  <td className="py-4 px-6 text-center">1,000</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr className="border-b bg-gray-50">
                  <td className="py-4 px-6 font-medium">OCR Accuracy</td>
                  <td className="py-4 px-6 text-center">95%</td>
                  <td className="py-4 px-6 text-center">99%</td>
                  <td className="py-4 px-6 text-center">99.9%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-medium">Processing Speed</td>
                  <td className="py-4 px-6 text-center">Standard</td>
                  <td className="py-4 px-6 text-center">2x Faster</td>
                  <td className="py-4 px-6 text-center">5x Faster</td>
                </tr>
                <tr className="border-b bg-gray-50">
                  <td className="py-4 px-6 font-medium">API Access</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">✓</td>
                  <td className="py-4 px-6 text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-medium">Support</td>
                  <td className="py-4 px-6 text-center">Email</td>
                  <td className="py-4 px-6 text-center">Priority</td>
                  <td className="py-4 px-6 text-center">24/7 Dedicated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 mb-8">Have questions? We're here to help.</p>
          
          <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan anytime.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, debit cards, and UPI.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">Yes, all plans come with a 7-day free trial.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold mb-2">How secure is my data?</h3>
              <p className="text-gray-600">Your data is encrypted and stored securely on Indian servers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
