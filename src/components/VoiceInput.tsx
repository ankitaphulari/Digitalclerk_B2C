import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useConversation } from '@11labs/react';

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  placeholder?: string;
  fieldName?: string;
  className?: string;
}

export const VoiceInput = ({ 
  onVoiceInput, 
  placeholder = "Click to speak", 
  fieldName = "field",
  className = ""
}: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();

  // Setup ElevenLabs conversation for voice input
  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice input connected');
      setIsListening(true);
    },
    onDisconnect: () => {
      console.log('Voice input disconnected');
      setIsListening(false);
      setIsProcessing(false);
    },
    onMessage: (message) => {
      console.log('Voice message received:', message);
      
      // Handle ElevenLabs message structure - adjust based on actual API response
      if (message.source === 'user' && message.message) {
        setTranscript(message.message);
        
        // Process the transcript for form field input
        processVoiceInput(message.message);
      }
    },
    onError: (error) => {
      console.error('Voice input error:', error);
      toast({
        title: "Voice Input Error",
        description: "There was an issue with voice recognition. Please try again.",
        variant: "destructive",
      });
      setIsListening(false);
      setIsProcessing(false);
    },
  });

  const processVoiceInput = useCallback(async (transcript: string) => {
    setIsProcessing(true);
    
    try {
      // Clean and format the transcript based on field type
      let processedText = transcript.trim();
      
      // Apply field-specific processing
      if (fieldName.toLowerCase().includes('name')) {
        // Capitalize names properly
        processedText = processedText
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('mobile')) {
        // Extract numbers from speech
        processedText = processedText.replace(/\D/g, '');
        if (processedText.length === 10) {
          processedText = `+91 ${processedText}`;
        }
      } else if (fieldName.toLowerCase().includes('email')) {
        // Handle email dictation
        processedText = processedText
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/at/g, '@')
          .replace(/dot/g, '.')
          .replace(/gmail/g, 'gmail');
      } else if (fieldName.toLowerCase().includes('address')) {
        // Capitalize address components
        processedText = processedText
          .split(',')
          .map(part => part.trim().replace(/\b\w/g, l => l.toUpperCase()))
          .join(', ');
      } else if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('dob')) {
        // Handle date dictation
        processedText = formatSpokenDate(processedText);
      }
      
      onVoiceInput(processedText);
      
      toast({
        title: "Voice Input Processed",
        description: `Filled "${fieldName}" with voice input`,
      });
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process voice input",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      await conversation.endSession();
    }
  }, [fieldName, onVoiceInput, conversation, toast]);

  const formatSpokenDate = (spokenDate: string): string => {
    // Convert spoken date formats to standard format
    const dateText = spokenDate.toLowerCase();
    
    // Handle common spoken date patterns
    const patterns = [
      { regex: /(\d{1,2})(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/g, format: 'DD Month YYYY' },
      { regex: /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/g, format: 'DD MM YYYY' },
      { regex: /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(st|nd|rd|th)?\s+(\d{4})/g, format: 'Month DD YYYY' }
    ];
    
    for (const pattern of patterns) {
      const match = pattern.regex.exec(dateText);
      if (match) {
        // Convert to DD/MM/YYYY format
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        
        if (pattern.format === 'DD Month YYYY') {
          const day = match[1].padStart(2, '0');
          const monthIndex = months.indexOf(match[3]);
          const month = (monthIndex + 1).toString().padStart(2, '0');
          const year = match[4];
          return `${day}/${month}/${year}`;
        } else if (pattern.format === 'Month DD YYYY') {
          const monthIndex = months.indexOf(match[1]);
          const month = (monthIndex + 1).toString().padStart(2, '0');
          const day = match[2].padStart(2, '0');
          const year = match[4];
          return `${day}/${month}/${year}`;
        }
      }
    }
    
    return spokenDate; // Return original if no pattern matches
  };

  const toggleVoiceInput = async () => {
    if (!isListening) {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Start voice conversation for form input
        await conversation.startSession({
          agentId: 'form-input-agent', // This should be configured for form input
        });
        
      } catch (error) {
        console.error('Error starting voice input:', error);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      }
    } else {
      await conversation.endSession();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant={isListening ? "default" : "outline"}
        size="sm"
        onClick={toggleVoiceInput}
        disabled={isProcessing}
        className={`${
          isListening 
            ? 'bg-accent hover:bg-accent/90 text-white shadow-accent' 
            : 'border-primary/20 hover:bg-primary/5'
        } transition-all duration-300`}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isListening ? (
          <Mic className="w-4 h-4" />
        ) : (
          <MicOff className="w-4 h-4" />
        )}
      </Button>
      
      {isListening && (
        <Card className="border-accent/20 bg-accent/5 shadow-soft">
          <CardContent className="p-2">
            <div className="flex items-center gap-2 text-sm text-accent">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span>Listening for {fieldName}...</span>
            </div>
            {transcript && (
              <div className="mt-1 text-xs text-muted-foreground">
                "{transcript}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};