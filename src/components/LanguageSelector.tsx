import React, { useState, useEffect } from 'react';

interface Language {
  code: string;
  name: string;
  flag: string;
  flagUrl: string;
}

interface LanguageSelectorProps {
  currentLanguage?: string;
  onLanguageChange?: (languageCode: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  currentLanguage = 'en', 
  onLanguageChange 
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Language configuration with flags
  const languages: Language[] = [
    { 
      code: 'en', 
      name: 'English', 
      flag: '🇺🇸',
      flagUrl: 'https://flagcdn.com/w20/us.png'
    },
    { 
      code: 'hi', 
      name: 'Hindi (हिंदी)', 
      flag: '🇮🇳',
      flagUrl: 'https://flagcdn.com/w20/in.png'
    },
    { 
      code: 'mr', 
      name: 'Marathi (मराठी)', 
      flag: '🇮🇳',
      flagUrl: 'https://flagcdn.com/w20/in.png'
    },
    { 
      code: 'ta', 
      name: 'Tamil (தமிழ்)', 
      flag: '🇮🇳',
      flagUrl: 'https://flagcdn.com/w20/in.png'
    }
  ];

  const selectedLanguage = languages.find(lang => lang.code === currentLanguage) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLanguageSelect = (language: Language) => {
    if (onLanguageChange) {
      onLanguageChange(language.code);
    }
    setIsOpen(false);
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'background-color 0.2s'
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '4px',
    width: '250px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
    zIndex: 50,
    maxHeight: '300px',
    overflowY: 'auto'
  };

  const flagStyle: React.CSSProperties = {
    width: '20px',
    height: '15px',
    marginRight: '8px',
    objectFit: 'cover',
    borderRadius: '2px',
    boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)'
  };

  const dropdownFlagStyle: React.CSSProperties = {
    width: '20px',
    height: '15px',
    marginRight: '10px',
    objectFit: 'cover',
    borderRadius: '2px',
    boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div className="language-selector" style={{ position: 'relative', display: 'inline-block' }}>
      {/* Selected Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyle}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = 'white';
        }}
      >
        <img 
          src={selectedLanguage.flagUrl}
          alt={`${selectedLanguage.name} flag`}
          style={flagStyle}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.outerHTML = `<span style="margin-right: 8px; font-size: 16px;">${selectedLanguage.flag}</span>`;
          }}
        />
        <span>{selectedLanguage.name}</span>
        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={dropdownStyle}>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                backgroundColor: selectedLanguage.code === language.code ? '#f3f4f6' : 'white',
                cursor: 'pointer',
                fontSize: '14px',
                color: selectedLanguage.code === language.code ? '#111827' : '#374151',
                fontWeight: selectedLanguage.code === language.code ? '600' : 'normal',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedLanguage.code !== language.code) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLanguage.code !== language.code) {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                }
              }}
            >
              <img 
                src={language.flagUrl}
                alt={`${language.name} flag`}
                style={dropdownFlagStyle}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.outerHTML = `<span style="margin-right: 10px; font-size: 16px;">${language.flag}</span>`;
                }}
              />
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
