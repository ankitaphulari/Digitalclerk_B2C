import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DocumentFile {
  id: string;
  name: string;
  type: string;
  file: File;
}

const CreateProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
  });
  const [documents, setDocuments] = useState<DocumentFile[]>([]);

  const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE'; // Replace after publishing extension

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: DocumentFile = {
      id: Date.now().toString(),
      name: file.name,
      type: docType,
      file: file,
    };

    setDocuments(prev => [...prev, newDoc]);

    // TODO: Send to backend for OCR extraction
    await extractDataFromDocument(file, docType);
  };

  const extractDataFromDocument = async (file: File, docType: string) => {
    setLoading(true);
    try {
      // TODO: Replace with your actual OCR API endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', docType);

      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      });

      const extractedData = await response.json();

      // Auto-fill form fields with extracted data
      if (extractedData.name) {
        setFormData(prev => ({ ...prev, clientName: extractedData.name }));
      }
      if (extractedData.email) {
        setFormData(prev => ({ ...prev, email: extractedData.email }));
      }
      if (extractedData.phone) {
        setFormData(prev => ({ ...prev, phone: extractedData.phone }));
      }
      if (extractedData.address) {
        setFormData(prev => ({ ...prev, address: extractedData.address }));
      }

    } catch (error) {
      console.error('OCR extraction failed:', error);
      alert('Failed to extract data from document');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save profile to your database
      const profileData = {
        id: Date.now().toString(),
        ...formData,
        documents: documents.map(d => ({ name: d.name, type: d.type })),
        createdAt: new Date().toISOString(),
      };

      // TODO: Replace with your actual API endpoint
      await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      // 2. Send to Chrome Extension
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          {
            action: 'profileCreated',
            data: {
              profileId: profileData.id,
              ...formData,
              extractedData: formData, // OCR extracted data
            }
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('Extension communication error:', chrome.runtime.lastError);
              alert('Profile saved! Install the Chrome extension to use it for form filling.');
            } else if (response?.success) {
              alert('✓ Profile created and synced with extension!');
              navigate('/profiles'); // Redirect to profile list
            }
          }
        );
      } else {
        alert('Profile saved! Install the Chrome extension to use it.');
        navigate('/profiles');
      }

    } catch (error) {
      console.error('Profile creation failed:', error);
      alert('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Client Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+91 1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter complete address"
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Upload Documents</h2>
            
            {/* Aadhaar Card */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
              <input
                type="file"
                id="aadhaarUpload"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, 'aadhaar')}
                className="hidden"
              />
              <label htmlFor="aadhaarUpload" className="cursor-pointer">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm font-medium text-gray-700">Upload Aadhaar Card</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max 10MB)</p>
              </label>
            </div>

            {/* PAN Card */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
              <input
                type="file"
                id="panUpload"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, 'pan')}
                className="hidden"
              />
              <label htmlFor="panUpload" className="cursor-pointer">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm font-medium text-gray-700">Upload PAN Card</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max 10MB)</p>
              </label>
            </div>

            {/* Other Documents */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
              <input
                type="file"
                id="otherUpload"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, 'other')}
                className="hidden"
              />
              <label htmlFor="otherUpload" className="cursor-pointer">
                <div className="text-4xl mb-2">📎</div>
                <p className="text-sm font-medium text-gray-700">Upload Other Documents</p>
                <p className="text-xs text-gray-500 mt-1">Passport, Driving License, etc.</p>
              </label>
            </div>
          </div>

          {/* Uploaded Documents List */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Uploaded Documents:</h3>
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{doc.name}</span>
                  <span className="text-xs text-gray-500 uppercase">{doc.type}</span>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Save Profile'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/profiles')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile;
