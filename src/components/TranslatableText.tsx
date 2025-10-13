import React from 'react';
import { useRealtimeTranslation } from '@/hooks/useRealtimeTranslation';

interface TranslatableTextProps {
  text: string;
  className?: string;
  component?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const TranslatableText: React.FC<TranslatableTextProps> = ({ 
  text, 
  className = '', 
  component = 'span' 
}) => {
  const { translateText, getDisplayText, isTranslating } = useRealtimeTranslation();

  React.useEffect(() => {
    translateText(text);
  }, [text, translateText]);

  const Component = component;
  const displayText = getDisplayText();

  return (
    <Component className={`${className} ${isTranslating ? 'opacity-70' : ''}`}>
      {displayText}
    </Component>
  );
};