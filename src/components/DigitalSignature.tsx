import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  PenTool, 
  Upload, 
  Trash2, 
  Download, 
  Save,
  RefreshCw,
  Check,
  FileImage,
  Signature
} from 'lucide-react';

interface SignatureData {
  id: string;
  name: string;
  type: 'drawn' | 'uploaded' | 'typed';
  data: string; // base64 encoded image or text
  createdAt: string;
  isDefault: boolean;
}

export const DigitalSignature = () => {
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [activeTab, setActiveTab] = useState('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved signatures from localStorage
    const savedSignatures = localStorage.getItem('digital_signatures');
    if (savedSignatures) {
      setSignatures(JSON.parse(savedSignatures));
    }
  }, []);

  useEffect(() => {
    // Save signatures to localStorage whenever signatures change
    localStorage.setItem('digital_signatures', JSON.stringify(signatures));
  }, [signatures]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !signatureName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for your signature",
        variant: "destructive",
      });
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    
    const newSignature: SignatureData = {
      id: crypto.randomUUID(),
      name: signatureName.trim(),
      type: 'drawn',
      data: dataUrl,
      createdAt: new Date().toISOString(),
      isDefault: signatures.length === 0
    };

    setSignatures(prev => [...prev, newSignature]);
    setSignatureName('');
    clearCanvas();

    toast({
      title: "Signature Saved",
      description: `"${newSignature.name}" has been saved successfully`,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !signatureName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and provide a name",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      const newSignature: SignatureData = {
        id: crypto.randomUUID(),
        name: signatureName.trim(),
        type: 'uploaded',
        data: dataUrl,
        createdAt: new Date().toISOString(),
        isDefault: signatures.length === 0
      };

      setSignatures(prev => [...prev, newSignature]);
      setSignatureName('');

      toast({
        title: "Signature Uploaded",
        description: `"${newSignature.name}" has been saved successfully`,
      });
    };

    reader.readAsDataURL(file);
  };

  const saveTypedSignature = () => {
    if (!typedSignature.trim() || !signatureName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your signature text and provide a name",
        variant: "destructive",
      });
      return;
    }

    // Create a canvas to generate typed signature image
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'black';
      ctx.font = '36px "Dancing Script", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
    }

    const dataUrl = canvas.toDataURL('image/png');

    const newSignature: SignatureData = {
      id: crypto.randomUUID(),
      name: signatureName.trim(),
      type: 'typed',
      data: dataUrl,
      createdAt: new Date().toISOString(),
      isDefault: signatures.length === 0
    };

    setSignatures(prev => [...prev, newSignature]);
    setSignatureName('');
    setTypedSignature('');

    toast({
      title: "Signature Created",
      description: `"${newSignature.name}" has been saved successfully`,
    });
  };

  const deleteSignature = (id: string) => {
    setSignatures(prev => prev.filter(sig => sig.id !== id));
    toast({
      title: "Signature Deleted",
      description: "Signature has been removed",
    });
  };

  const setDefaultSignature = (id: string) => {
    setSignatures(prev => prev.map(sig => ({
      ...sig,
      isDefault: sig.id === id
    })));
    toast({
      title: "Default Signature Set",
      description: "This signature will be used by default",
    });
  };

  const downloadSignature = (signature: SignatureData) => {
    const link = document.createElement('a');
    link.download = `${signature.name}.png`;
    link.href = signature.data;
    link.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-feature">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signature className="w-5 h-5" />
            Digital Signature Manager
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create, store, and manage your digital signatures securely
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw" className="gap-2">
                <PenTool className="w-4 h-4" />
                Draw
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="type" className="gap-2">
                <FileImage className="w-4 h-4" />
                Type
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="signature-name">Signature Name</Label>
                <Input
                  id="signature-name"
                  placeholder="e.g., Primary Signature, Official Signature"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <TabsContent value="draw" className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="border border-border rounded bg-white cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearCanvas} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Clear
                  </Button>
                  <Button onClick={saveDrawnSignature} className="gap-2 flex-1">
                    <Save className="w-4 h-4" />
                    Save Signature
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-gradient-button rounded-lg flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">Upload Signature Image</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        PNG, JPG, or GIF up to 5MB
                      </p>
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Choose File
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="type" className="space-y-4">
                <div>
                  <Label htmlFor="typed-signature">Type Your Signature</Label>
                  <Input
                    id="typed-signature"
                    placeholder="Enter your full name"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    className="mt-1 text-2xl font-script"
                    style={{ fontFamily: '"Dancing Script", cursive' }}
                  />
                </div>
                
                <Button onClick={saveTypedSignature} className="gap-2 w-full">
                  <Save className="w-4 h-4" />
                  Create Signature
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Saved Signatures */}
      {signatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Signatures</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your digital signatures
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signatures.map((signature) => (
                <div
                  key={signature.id}
                  className={`border rounded-lg p-4 space-y-3 ${
                    signature.isDefault ? 'border-primary bg-gradient-feature' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{signature.name}</h4>
                      <p className="text-xs text-muted-foreground capitalize">
                        {signature.type} signature
                      </p>
                    </div>
                    {signature.isDefault && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  
                  <div className="bg-white border rounded p-2">
                    <img
                      src={signature.data}
                      alt={signature.name}
                      className="max-w-full h-16 object-contain mx-auto"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    {!signature.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultSignature(signature.id)}
                        className="flex-1"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSignature(signature)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSignature(signature.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};