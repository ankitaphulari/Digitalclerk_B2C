// Acceptance tests for OCR extraction with space preservation
// Tests PAN and Aadhaar extraction with multi-word names and addresses

import { PANCardExtractor } from '../PANCardExtractor';
import { AadhaarExtractor } from '../AadhaarExtractor';
import { DocumentTypeDetector } from '../DocumentTypeDetector';

// Test data samples
const PAN_SAMPLE = `
INCOME TAX DEPARTMENT
GOVT OF INDIA
VAIDEHI VIVEKANAND PHULARI
VIVEKANAND PHULARI
21/06/2005
ABCDE1234F
`;

const AADHAAR_SAMPLE = `
GOVERNMENT OF INDIA
Name: Vaidehi Vivekanand Phulari
DOB: 21-06-2005
Address:
Silver Oaks Society, Dehu Alandi Road, Moshi, Pune 412105
1234 5678 9012
`;

// Test functions (these would be actual unit tests in a real test framework)
export const testPANExtraction = () => {
  console.log('Testing PAN Card Extraction...');
  
  const result = PANCardExtractor.extractFromPANCard(PAN_SAMPLE);
  
  console.log('PAN Extraction Result:', result);
  
  // Expected results
  const expected = {
    name: "Vaidehi Vivekanand Phulari",
    fathersName: "Vivekanand Phulari", 
    dob: "21/06/2005",
    pan: "ABCDE1234F"
  };
  
  // Verify space preservation in names
  const nameMatch = result.name === expected.name;
  const fatherNameMatch = result.fathersName === expected.fathersName;
  const dobMatch = result.dob === expected.dob;
  const panMatch = result.pan === expected.pan;
  
  console.log('✅ PAN Test Results:');
  console.log(`  Name: ${nameMatch ? '✅' : '❌'} "${result.name}" (expected: "${expected.name}")`);
  console.log(`  Father's Name: ${fatherNameMatch ? '✅' : '❌'} "${result.fathersName}" (expected: "${expected.fathersName}")`);
  console.log(`  DOB: ${dobMatch ? '✅' : '❌'} "${result.dob}" (expected: "${expected.dob}")`);
  console.log(`  PAN: ${panMatch ? '✅' : '❌'} "${result.pan}" (expected: "${expected.pan}")`);
  
  return nameMatch && fatherNameMatch && dobMatch && panMatch;
};

export const testAadhaarExtraction = () => {
  console.log('Testing Aadhaar Card Extraction...');
  
  const result = AadhaarExtractor.extractFromAadhaarCard(AADHAAR_SAMPLE);
  
  console.log('Aadhaar Extraction Result:', result);
  
  // Expected results
  const expected = {
    name: "Vaidehi Vivekanand Phulari",
    dob: "21-06-2005",
    aadhaar: "123456789012",
    address: "Silver Oaks Society, Dehu Alandi Road, Moshi, Pune"
  };
  
  // Verify space preservation
  const nameMatch = result.name === expected.name;
  const dobMatch = result.dob === expected.dob;
  const aadhaarMatch = result.aadhaar === expected.aadhaar;
  const addressContainsExpected = result.address?.includes("Dehu Alandi Road") && 
                                  result.address?.includes("Silver Oaks Society");
  
  console.log('✅ Aadhaar Test Results:');
  console.log(`  Name: ${nameMatch ? '✅' : '❌'} "${result.name}" (expected: "${expected.name}")`);
  console.log(`  DOB: ${dobMatch ? '✅' : '❌'} "${result.dob}" (expected: "${expected.dob}")`);
  console.log(`  Aadhaar: ${aadhaarMatch ? '✅' : '❌'} "${result.aadhaar}" (expected: "${expected.aadhaar}")`);
  console.log(`  Address: ${addressContainsExpected ? '✅' : '❌'} Contains expected street and society names`);
  console.log(`    Full address: "${result.address}"`);
  
  return nameMatch && dobMatch && aadhaarMatch && addressContainsExpected;
};

export const testDocumentTypeDetection = () => {
  console.log('Testing Document Type Detection...');
  
  const panDetection = DocumentTypeDetector.detectDocumentType(PAN_SAMPLE);
  const aadhaarDetection = DocumentTypeDetector.detectDocumentType(AADHAAR_SAMPLE);
  
  console.log('PAN Detection:', panDetection);
  console.log('Aadhaar Detection:', aadhaarDetection);
  
  const panCorrect = panDetection.type === 'pan' && panDetection.confidence > 0.5;
  const aadhaarCorrect = aadhaarDetection.type === 'aadhaar' && aadhaarDetection.confidence > 0.5;
  
  console.log('✅ Document Type Detection Results:');
  console.log(`  PAN Detection: ${panCorrect ? '✅' : '❌'} Type: ${panDetection.type}, Confidence: ${panDetection.confidence}`);
  console.log(`  Aadhaar Detection: ${aadhaarCorrect ? '✅' : '❌'} Type: ${aadhaarDetection.type}, Confidence: ${aadhaarDetection.confidence}`);
  
  return panCorrect && aadhaarCorrect;
};

// Run all tests
export const runAllExtractionTests = () => {
  console.log('🧪 Running OCR Extraction Tests...\n');
  
  const panTest = testPANExtraction();
  console.log('');
  
  const aadhaarTest = testAadhaarExtraction();
  console.log('');
  
  const detectionTest = testDocumentTypeDetection();
  console.log('');
  
  const allPassed = panTest && aadhaarTest && detectionTest;
  
  console.log(`🎯 Overall Test Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return allPassed;
};

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    runAllExtractionTests();
  }, 1000);
}