import { useState } from 'react';
import { Building2, MapPin, Phone, Mail, CreditCard } from 'lucide-react';

export default function BusinessSignup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    location: '',
    state: '',
    phone: '',
    email: '',
    plan: ''
  });

  const plans = [
    {
      name: 'Starter',
      price: 999,
      features: ['100 documents/month', 'Basic OCR', 'Email support']
    },
    {
      name: 'Professional',
      price: 1999,
      features: ['1000 documents/month', 'Advanced OCR', 'Priority support', 'API access']
    },
    {
      name: 'Enterprise',
      price: 2999,
      features: ['Unlimited documents', 'Premium OCR', '24/7 support', 'Custom integrations']
    }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1 && formData.companyName && formData.location && formData.state && formData.phone && formData.email) {
      setStep(2);
    }
  };

  const handlePlanSelect = (planName, price) => {
    setFormData({ ...formData, plan: planName, planPrice: price });
    setStep(3);
  };

  const handlePayment = () => {
    // Integrate Razorpay here
    const options = {
      key: 'YOUR_RAZORPAY_KEY',
      amount: formData.planPrice * 100,
      currency: 'INR',
      name: 'DigitalClerk',
      description: `${formData.plan} Plan`,
      handler: function(response) {
        // Payment successful
        setStep(4);
        // Send data to backend to create account
        createAccount(response.razorpay_payment_id);
      }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const createAccount = async (paymentId) => {
    // API call to create account
    console.log('Account created with payment:', paymentId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to DigitalClerk</h1>
          <p className="text-gray-600">Complete your business signup in 3 easy steps</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 4 && <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Business Details */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Business Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center text-gray-700 font-medium mb-2">
                  <Building2 className="w-5 h-5 mr-2" />
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="ABC CA Firm"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-2">
                    <MapPin className="w-5 h-5 mr-2" />
                    City
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Mumbai"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-medium mb-2 block">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center text-gray-700 font-medium mb-2">
                  <Phone className="w-5 h-5 mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-gray-700 font-medium mb-2">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="abc@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Continue to Plans
            </button>
          </div>
        )}

        {/* Step 2: Choose Plan */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Plan</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition cursor-pointer"
                  onClick={() => handlePlanSelect(plan.name, plan.price)}
                >
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-blue-600 mb-4">
                    ₹{plan.price}<span className="text-sm text-gray-600">/month</span>
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                    Select Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Complete Payment</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-semibold">{formData.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span>Company:</span>
                  <span>{formData.companyName}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{formData.planPrice}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Proceed to Payment
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Account Created Successfully!</h2>
            <p className="text-gray-600 mb-6">Your login credentials have been sent to {formData.email}</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold mb-4">Next Steps:</h3>
              <ol className="text-left space-y-3">
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5">1</span>
                  <span>Install Chrome Extension</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5">2</span>
                  <span>Login with your credentials</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5">3</span>
                  <span>Start filling forms instantly!</span>
                </li>
              </ol>
            </div>

            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Download Chrome Extension
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
