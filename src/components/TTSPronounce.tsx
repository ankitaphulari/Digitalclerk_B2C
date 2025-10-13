import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TTSPronounceProps {
  text: string;
  voice?: string; // OpenAI tts voices: alloy, verse, etc.
  className?: string;
}

const TTSPronounce = ({ text, voice = 'alloy', className }: TTSPronounceProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const speak = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice },
      });
      if (error) throw error;
      const { audioContent, format } = data as { audioContent: string; format: string };
      const audio = new Audio(`data:audio/${format};base64,${audioContent}`);
      await audio.play();
    } catch (e: unknown) {
      let message = 'Could not play audio';
      if (e instanceof Error) {
        message = e.message;
      } else if (typeof e === 'string') {
        message = e;
      } else if (e && typeof (e as { message?: unknown }).message === 'string') {
        message = (e as { message?: string }).message!;
      }
      toast({ title: 'TTS error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={speak} disabled={loading} className={className} aria-label="Pronounce label">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
    </Button>
  );
};

export default TTSPronounce;
