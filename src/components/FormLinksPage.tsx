import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Upload } from 'lucide-react';

interface WebsiteLink {
  name: string;
  url: string;
  description: string;
}

interface FieldConfig {
  label: string;
  websites: WebsiteLink[];
}

// Configuration for each form type and their fields
const fieldConfigs: { [formType: string]: { [fieldKey: string]: FieldConfig } } = {
  aadhaar: {
    fullName: {
      label: 'Full Name',
      websites: [
        {
          name: 'UIDAI Official',
          url: 'https://uidai.gov.in/',
          description: 'Official UIDAI website for Aadhaar services'
        },
        {
          name: 'Aadhaar Enrollment',
          url: 'https://appointments.uidai.gov.in/',
          description: 'Book appointment for Aadhaar enrollment'
        }
      ]
    },
    dateOfBirth: {
      label: 'Date of Birth',
      websites: [
        {
          name: 'Birth Certificate',
          url: 'https://crsorgi.gov.in/',
          description: 'Civil Registration System - Birth Certificate'
        },
        {
          name: 'School Certificate',
          url: 'https://www.education.gov.in/',
          description: 'Educational certificates for age proof'
        }
      ]
    },
    address: {
      label: 'Address Proof',
      websites: [
        {
          name: 'Electricity Bill',
          url: 'https://www.seb.gov.in/',
          description: 'State Electricity Board for utility bills'
        },
        {
          name: 'Bank Statement',
          url: 'https://www.rbi.org.in/',
          description: 'Reserve Bank of India - Banking services'
        }
      ]
    },
    mobileNumber: {
      label: 'Mobile Number',
      websites: [
        {
          name: 'Mobile Verification',
          url: 'https://uidai.gov.in/my-aadhaar/verify-mobile.html',
          description: 'Verify mobile number with Aadhaar'
        }
      ]
    }
  },
  pan: {
    fullName: {
      label: 'Full Name',
      websites: [
        {
          name: 'Income Tax Department',
          url: 'https://www.incometax.gov.in/',
          description: 'Official Income Tax Department website'
        },
        {
          name: 'PAN Services',
          url: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
          description: 'NSDL PAN services'
        }
      ]
    },
    fatherName: {
      label: "Father's Name",
      websites: [
        {
          name: 'Birth Certificate',
          url: 'https://crsorgi.gov.in/',
          description: 'Civil Registration System for birth certificates'
        }
      ]
    },
    dateOfBirth: {
      label: 'Date of Birth',
      websites: [
        {
          name: 'Birth Certificate',
          url: 'https://crsorgi.gov.in/',
          description: 'Official birth certificate from CRS'
        }
      ]
    },
    address: {
      label: 'Address',
      websites: [
        {
          name: 'Address Proof Documents',
          url: 'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1',
          description: 'Acceptable address proof documents'
        }
      ]
    }
  },
  passport: {
    fullName: {
      label: 'Full Name',
      websites: [
        {
          name: 'Passport Seva',
          url: 'https://www.passportindia.gov.in/',
          description: 'Official Passport Seva website'
        }
      ]
    },
    dateOfBirth: {
      label: 'Date of Birth',
      websites: [
        {
          name: 'Birth Certificate',
          url: 'https://crsorgi.gov.in/',
          description: 'Civil Registration System'
        }
      ]
    },
    placeOfBirth: {
      label: 'Place of Birth',
      websites: [
        {
          name: 'Birth Certificate',
          url: 'https://crsorgi.gov.in/',
          description: 'Official birth certificate'
        }
      ]
    },
    address: {
      label: 'Address',
      websites: [
        {
          name: 'Address Proof',
          url: 'https://www.passportindia.gov.in/AppOnlineProject/online/procFormA',
          description: 'Passport address proof requirements'
        }
      ]
    }
  },
  'driving-license': {
    fullName: {
      label: 'Full Name',
      websites: [
        {
          name: 'Parivahan',
          url: 'https://parivahan.gov.in/',
          description: 'Official Ministry of Road Transport website'
        }
      ]
    },
    dateOfBirth: {
      label: 'Date of Birth',
      websites: [
        {
          name: 'Age Proof Documents',
          url: 'https://parivahan.gov.in/parivahan/',
          description: 'Acceptable age proof documents'
        }
      ]
    },
    address: {
      label: 'Address',
      websites: [
        {
          name: 'Address Proof',
          url: 'https://parivahan.gov.in/parivahan/',
          description: 'Address proof for driving license'
        }
      ]
    },
    bloodGroup: {
      label: 'Blood Group',
      websites: [
        {
          name: 'Medical Certificate',
          url: 'https://parivahan.gov.in/parivahan/',
          description: 'Medical certificate requirements'
        }
      ]
    }
  },
  scholarship: {
    fullName: {
      label: 'Full Name',
      websites: [
        {
          name: 'National Scholarship Portal',
          url: 'https://scholarships.gov.in/',
          description: 'Official scholarship portal'
        }
      ]
    },
    academicDetails: {
      label: 'Academic Details',
      websites: [
        {
          name: 'Academic Certificates',
          url: 'https://www.education.gov.in/',
          description: 'Ministry of Education'
        }
      ]
    },
    familyIncome: {
      label: 'Family Income',
      websites: [
        {
          name: 'Income Certificate',
          url: 'https://edistrict.gov.in/',
          description: 'District collector office for income certificate'
        }
      ]
    }
  },
  gst: {
    businessName: {
      label: 'Business Name',
      websites: [
        {
          name: 'GST Portal',
          url: 'https://www.gst.gov.in/',
          description: 'Official GST portal'
        }
      ]
    },
    panNumber: {
      label: 'PAN Number',
      websites: [
        {
          name: 'PAN Verification',
          url: 'https://www.incometax.gov.in/',
          description: 'Income Tax Department PAN services'
        }
      ]
    },
    businessAddress: {
      label: 'Business Address',
      websites: [
        {
          name: 'Business Registration',
          url: 'https://www.mca.gov.in/',
          description: 'Ministry of Corporate Affairs'
        }
      ]
    }
  }
};

const FormLinksPage: React.FC = () => {
  const { formType } = useParams<{ formType: string }>();
  const navigate = useNavigate();
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const currentFieldConfigs = fieldConfigs[formType as string] || {};
  
  const formTitles: { [key: string]: string } = {
    aadhaar: 'Aadhaar Card Application',
    pan: 'PAN Card Application',
    passport: 'Passport Application',
    'driving-license': 'Driving License Application',
    scholarship: 'Scholarship Application',
    gst: 'GST Registration'
  };

  const handleFieldClick = (fieldKey: string) => {
    setSelectedField(selectedField === fieldKey ? null : fieldKey);
  };

  const handleWebsiteClick = (url: string) => {
    window.open(url, '_blank');
  };

  const handleUploadClick = (fieldKey: string) => {
    navigate(`/document-upload/${formType}?field=${fieldKey}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div
        style={{
          maxWidth: 1024,
          margin: '0 auto',
          padding: '32px 16px',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: 14
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', margin: 0, color: '#111827' }}>
            {formTitles[formType as string] || 'Form Application'}
          </h1>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 16 }}>
            Click on any form field below to see relevant website links and upload documents.
          </p>
        </div>

        {/* Form Fields */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px rgb(0 0 0 / 0.06)',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: '600', marginBottom: 24, color: '#111827' }}>
            Form Fields
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(currentFieldConfigs).map(([fieldKey, config]) => (
              <div key={fieldKey} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                {/* Field Header - Clickable */}
                <div
                  onClick={() => handleFieldClick(fieldKey)}
                  style={{
                    padding: 16,
                    backgroundColor: selectedField === fieldKey ? '#f3f4f6' : 'white',
                    cursor: 'pointer',
                    borderBottom: selectedField === fieldKey ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: '500', color: '#374151' }}>
                    {config.label}
                  </span>
                  <span style={{ 
                    fontSize: 12, 
                    color: '#6b7280',
                    transform: selectedField === fieldKey ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    ▼
                  </span>
                </div>

                {/* Expanded Content */}
                {selectedField === fieldKey && (
                  <div style={{ padding: 16, backgroundColor: '#f9fafb' }}>
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
                        Relevant Websites:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {config.websites.map((website, index) => (
                          <div
                            key={index}
                            onClick={() => handleWebsiteClick(website.url)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: 12,
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: 6,
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <ExternalLink style={{ width: 16, height: 16, color: '#3b82f6' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                                {website.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>
                                {website.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upload Button */}
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                      <button
                        onClick={() => handleUploadClick(fieldKey)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 14,
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                      >
                        <Upload style={{ width: 16, height: 16 }} />
                        Upload Document for {config.label}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Global Upload Button */}
          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 24, paddingTop: 24 }}>
            <button
              onClick={() => navigate(`/document-upload/${formType}`)}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            >
              Upload All Documents at Once
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormLinksPage;
