import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface DocumentCardProps {
  document: {
    id: string;
    name: string;
    type?: string | null;
    extractedFields?: Record<string, unknown> | null;
    confidence?: number;
  };
  index: number;
  onRemove: (index: number) => void;
}

const getDocumentIcon = (type?: string | null) => {
  switch (type) {
    case "aadhaar":
      return "🆔";
    case "pan":
      return "💳";
    case "passport":
      return "📘";
    case "license":
      return "🚗";
    default:
      return "📄";
  }
};

// Helper function to format field names for display
const formatFieldName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    .trim();
};

// Helper function to check if a field should be displayed
const shouldDisplayField = (key: string, value: unknown): boolean => {
  // Filter out confidence fields and null/undefined values
  if (key.includes("_confidence") || key.includes("confidence")) return false;
  if (!value) return false;
  if (typeof value === 'string' && value.trim().length === 0) return false;
  if (typeof value === 'object') return false; // Skip complex objects
  
  // Skip internal system fields
  const skipFields = ['id', 'created_at', 'updated_at', 'user_id'];
  if (skipFields.includes(key.toLowerCase())) return false;
  
  return true;
};

export function DocumentCard({ document, index, onRemove }: DocumentCardProps) {
  const fields = document.extractedFields || {};
  
  // Filter and format entries for display
  const entries = Object.entries(fields).filter(([key, value]) => 
    shouldDisplayField(key, value)
  );

  console.log('DocumentCard - Raw fields:', fields);
  console.log('DocumentCard - Filtered entries:', entries);

  return (
    <div className="border rounded-lg p-4 bg-background shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {getDocumentIcon(document.type)}
          </span>
          <div>
            <h3 className="font-medium text-sm md:text-base">{document.name}</h3>
            <p className="text-xs text-muted-foreground">
              {(document.type || "unknown").toUpperCase()} Document
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(index)} 
          aria-label="Remove document"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-1 mt-2">
          {entries.map(([key, value]) => (
            <div key={key} className="text-xs">
              <span className="font-medium">
                {formatFieldName(key)}:
              </span>
              <span className="ml-1 text-muted-foreground">
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-xs text-muted-foreground italic">
          No data extracted
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Confidence: {Math.round(document.confidence || 0)}%
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm">Edit</Button>
          <Button size="sm">Use Data</Button>
        </div>
      </div>
    </div>
  );
}
