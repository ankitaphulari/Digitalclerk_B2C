// NEW: Complete Marksheet/Grade Card extraction with ALL 17 fields
// Extracts: Roll Number, Name, Father's Name, Marks, Percentage, CGPA, Board/University, etc.

import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface MarksheetExtractionResult {
  rollNumber?: string;
  registrationNumber?: string;
  name?: string;
  fathersName?: string;
  mothersName?: string;
  dob?: string;
  class?: string;
  boardName?: string;
  schoolName?: string;
  examName?: string;
  yearOfPassing?: string;
  monthYear?: string;
  totalMarks?: string;
  marksObtained?: string;
  percentage?: string;
  cgpa?: string;
  grade?: string;
  division?: string;
  result?: string;
  subjects?: Array<{subject: string; marks: string}>;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class MarksheetExtractor {
  private static readonly HEADER_BLACKLIST = [
    'MARKSHEET', 'MARK SHEET', 'GRADE CARD',
    'UNIVERSITY', 'BOARD', 'EXAMINATION',
    'STATEMENT OF MARKS'
  ];

  static extractFromMarksheet(ocrText: string): MarksheetExtractionResult {
    const result: MarksheetExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Marksheet - Processing');

    // 1. Roll Number
    const rollNumber = this.extractRollNumber(ocrText);
    if (rollNumber) {
      result.rollNumber = rollNumber;
      result.extractedFields.rollNumber = rollNumber;
      result.extractedFields.roll_number = rollNumber;
      result.confidence += 30;
      console.log('✅ Roll Number:', rollNumber);
    }

    // 2. Registration Number
    const registrationNumber = this.extractRegistrationNumber(ocrText);
    if (registrationNumber) {
      result.registrationNumber = registrationNumber;
      result.extractedFields.registrationNumber = registrationNumber;
      result.extractedFields.registration_number = registrationNumber;
      console.log('✅ Registration Number:', registrationNumber);
    }

    // 3. Student Name
    const name = this.extractName(ocrText);
    if (name) {
      result.name = name;
      result.extractedFields.name = name;
      result.extractedFields.studentName = name;
      result.confidence += 15;
      console.log('✅ Name:', name);
    }

    // 4. Father's Name
    const fathersName = this.extractFathersName(ocrText);
    if (fathersName) {
      result.fathersName = fathersName;
      result.extractedFields.fathersName = fathersName;
      result.extractedFields.fathers_name = fathersName;
      result.confidence += 10;
      console.log('✅ Father\'s Name:', fathersName);
    }

    // 5. Mother's Name
    const mothersName = this.extractMothersName(ocrText);
    if (mothersName) {
      result.mothersName = mothersName;
      result.extractedFields.mothersName = mothersName;
      console.log('✅ Mother\'s Name:', mothersName);
    }

    // 6. Date of Birth
    const dob = this.extractDOB(ocrText);
    if (dob) {
      result.dob = dob;
      result.extractedFields.dob = dob;
      result.extractedFields.dateOfBirth = dob;
      result.confidence += 5;
      console.log('✅ DOB:', dob);
    }

    // 7. Class/Standard
    const classStd = this.extractClass(ocrText);
    if (classStd) {
      result.class = classStd;
      result.extractedFields.class = classStd;
      result.extractedFields.standard = classStd;
      result.confidence += 10;
      console.log('✅ Class:', classStd);
    }

    // 8. Board/University Name
    const boardName = this.extractBoardName(ocrText);
    if (boardName) {
      result.boardName = boardName;
      result.extractedFields.boardName = boardName;
      result.extractedFields.universityName = boardName;
      result.confidence += 10;
      console.log('✅ Board/University:', boardName);
    }

    // 9. School/College Name
    const schoolName = this.extractSchoolName(ocrText);
    if (schoolName) {
      result.schoolName = schoolName;
      result.extractedFields.schoolName = schoolName;
      result.extractedFields.institutionName = schoolName;
      console.log('✅ School/College:', schoolName);
    }

    // 10. Examination Name
    const examName = this.extractExamName(ocrText);
    if (examName) {
      result.examName = examName;
      result.extractedFields.examName = examName;
      console.log('✅ Examination:', examName);
    }

    // 11. Year of Passing
    const yearOfPassing = this.extractYearOfPassing(ocrText);
    if (yearOfPassing) {
      result.yearOfPassing = yearOfPassing;
      result.extractedFields.yearOfPassing = yearOfPassing;
      result.extractedFields.passingYear = yearOfPassing;
      result.confidence += 10;
      console.log('✅ Year of Passing:', yearOfPassing);
    }

    // 12. Month & Year
    const monthYear = this.extractMonthYear(ocrText);
    if (monthYear) {
      result.monthYear = monthYear;
      result.extractedFields.monthYear = monthYear;
      console.log('✅ Month & Year:', monthYear);
    }

    // 13. Total Marks
    const totalMarks = this.extractTotalMarks(ocrText);
    if (totalMarks) {
      result.totalMarks = totalMarks;
      result.extractedFields.totalMarks = totalMarks;
      result.extractedFields.maximumMarks = totalMarks;
      console.log('✅ Total Marks:', totalMarks);
    }

    // 14. Marks Obtained
    const marksObtained = this.extractMarksObtained(ocrText);
    if (marksObtained) {
      result.marksObtained = marksObtained;
      result.extractedFields.marksObtained = marksObtained;
      result.extractedFields.obtainedMarks = marksObtained;
      console.log('✅ Marks Obtained:', marksObtained);
    }

    // 15. Percentage
    const percentage = this.extractPercentage(ocrText);
    if (percentage) {
      result.percentage = percentage;
      result.extractedFields.percentage = percentage;
      result.confidence += 10;
      console.log('✅ Percentage:', percentage);
    }

    // 16. CGPA/GPA
    const cgpa = this.extractCGPA(ocrText);
    if (cgpa) {
      result.cgpa = cgpa;
      result.extractedFields.cgpa = cgpa;
      result.extractedFields.gpa = cgpa;
      console.log('✅ CGPA:', cgpa);
    }

    // 17. Grade
    const grade = this.extractGrade(ocrText);
    if (grade) {
      result.grade = grade;
      result.extractedFields.grade = grade;
      console.log('✅ Grade:', grade);
    }

    // 18. Division
    const division = this.extractDivision(ocrText);
    if (division) {
      result.division = division;
      result.extractedFields.division = division;
      console.log('✅ Division:', division);
    }

    // 19. Result
    const resultStatus = this.extractResult(ocrText);
    if (resultStatus) {
      result.result = resultStatus;
      result.extractedFields.result = resultStatus;
      console.log('✅ Result:', resultStatus);
    }

    // 20. Subject-wise Marks
    const subjects = this.extractSubjects(ocrText);
    if (subjects && subjects.length > 0) {
      result.subjects = subjects;
      result.extractedFields.subjects = subjects;
      console.log('✅ Subjects:', subjects.length);
    }

    console.log('📊 Marksheet extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static extractRollNumber(text: string): string | null {
    const patterns = [
      /(?:Roll|Roll No|Roll Number)\s*:?\s*([A-Z0-9]{6,15})/gi,
      /(?:Enrolment|Enrollment)\s*(?:No|Number)?\s*:?\s*([A-Z0-9]{6,15})/gi
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractRegistrationNumber(text: string): string | null {
    const patterns = [
      /(?:Registration|Reg)\s*(?:No|Number)?\s*:?\s*([A-Z0-9]{6,15})/gi
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractName(text: string): string | null {
    const patterns = [
      /(?:Student Name|Name|Candidate Name)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name)) {
          return formatNameForDisplay(name);
        }
      }
    }
    return null;
  }

  private static extractFathersName(text: string): string | null {
    const patterns = [
      /(?:Father'?s?\s*Name|Father)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return formatNameForDisplay(match[1].trim());
    }
    return null;
  }

  private static extractMothersName(text: string): string | null {
    const patterns = [
      /(?:Mother'?s?\s*Name|Mother)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return formatNameForDisplay(match[1].trim());
    }
    return null;
  }

  private static extractDOB(text: string): string | null {
    const patterns = [
      /(?:DOB|Date of Birth)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractClass(text: string): string | null {
    const patterns = [
      /(?:Class|Standard|Course)\s*:?\s*(X{1,3}|I{1,3}V?|[0-9]{1,2}(?:th|st|nd|rd)?|B\.?A\.?|B\.?Sc\.?|M\.?A\.?|B\.?Tech\.?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }

  private static extractBoardName(text: string): string | null {
    const patterns = [
      /(?:Board|University)\s*:?\s*([A-Za-z\s&.-]{5,100}?)(?=\n|School|College)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim().replace(/\s+/g, ' ');
    }
    return null;
  }

  private static extractSchoolName(text: string): string | null {
    const patterns = [
      /(?:School|College|Institute)\s*:?\s*([A-Za-z\s&.-]{5,100}?)(?=\n|Board|University)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim().replace(/\s+/g, ' ');
    }
    return null;
  }

  private static extractExamName(text: string): string | null {
    const patterns = [
      /(?:Examination|Exam)\s*:?\s*([A-Za-z\s-]{5,50}?)(?=\n|Year|Result)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }

  private static extractYearOfPassing(text: string): string | null {
    const patterns = [
      /(?:Year of Passing|Passing Year|Year)\s*:?\s*(19\d{2}|20\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractMonthYear(text: string): string | null {
    const patterns = [
      /(?:Month|Month & Year)\s*:?\s*([A-Za-z]+\s*(?:19|20)\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractTotalMarks(text: string): string | null {
    const patterns = [
      /(?:Total|Maximum)\s*(?:Marks)?\s*:?\s*(\d{2,4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractMarksObtained(text: string): string | null {
    const patterns = [
      /(?:Marks Obtained|Obtained)\s*:?\s*(\d{2,4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractPercentage(text: string): string | null {
    const patterns = [
      /(?:Percentage|%|Percent)\s*:?\s*(\d{1,3}(?:\.\d{1,2})?)/i,
      /\b(\d{1,3}\.\d{2})%/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1] + '%';
    }
    return null;
  }

  private static extractCGPA(text: string): string | null {
    const patterns = [
      /(?:CGPA|GPA)\s*:?\s*(\d{1,2}(?:\.\d{1,2})?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractGrade(text: string): string | null {
    const patterns = [
      /(?:Grade)\s*:?\s*([A-F][+-]?|\d{1,2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractDivision(text: string): string | null {
    const patterns = [
      /(?:Division)\s*:?\s*(First|Second|Third|I|II|III|Distinction)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractResult(text: string): string | null {
    const patterns = [
      /(?:Result)\s*:?\s*(Pass|Passed|Fail|Failed|Distinction)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private static extractSubjects(text: string): Array<{subject: string; marks: string}> | null {
    // This is a simplified version - you may need more sophisticated parsing
    const subjects: Array<{subject: string; marks: string}> = [];
    
    // Look for common subject patterns
    const subjectPatterns = [
      /([A-Za-z\s]+)\s+(\d{1,3})/g
    ];

    // This would need more sophisticated logic based on marksheet format
    return subjects.length > 0 ? subjects : null;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
