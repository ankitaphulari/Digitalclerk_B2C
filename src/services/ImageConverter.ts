// Image Format Conversion and Processing Service
import { FormatRequirements } from './DocumentFormatRequirements';

export interface ConversionOptions {
  targetFormat?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
  backgroundColor?: string;
  removeBackground?: boolean;
  enhanceContrast?: boolean;
  grayscale?: boolean;
}

export class ImageConverter {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;
  
  private static getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        throw new Error('Cannot create canvas context');
      }
    }
    return { canvas: this.canvas, ctx: this.ctx! };
  }
  
  /**
   * Convert image format and apply transformations
   */
  static async convertImage(file: File, options: ConversionOptions): Promise<File> {
    try {
      const img = await this.loadImage(file);
      const { canvas, ctx } = this.getCanvas();
      
      // Calculate target dimensions
      const targetDimensions = this.calculateTargetDimensions(
        img.naturalWidth,
        img.naturalHeight,
        options
      );
      
      canvas.width = targetDimensions.width;
      canvas.height = targetDimensions.height;
      
      // Set background if specified
      if (options.backgroundColor) {
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Draw the image
      ctx.drawImage(img, 0, 0, targetDimensions.width, targetDimensions.height);
      
      // Apply post-processing effects
      if (options.enhanceContrast || options.grayscale) {
        await this.applyImageEffects(ctx, canvas.width, canvas.height, options);
      }
      
      // Remove background if specified (for passport photos)
      if (options.removeBackground) {
        await this.removeBackground(ctx, canvas.width, canvas.height);
      }
      
      // Convert to target format
      const targetFormat = options.targetFormat || file.type;
      const quality = (options.quality || 90) / 100;
      
      const blob = await this.canvasToBlob(canvas, targetFormat, quality);
      
      // Create new file with appropriate name
      const extension = this.getExtensionFromMimeType(targetFormat);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const newName = `${baseName}_converted.${extension}`;
      
      return new File([blob], newName, { type: targetFormat });
      
    } catch (error) {
      console.error('Image conversion failed:', error);
      throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Convert image to meet specific document requirements
   */
  static async convertToRequirements(file: File, requirements: FormatRequirements): Promise<File> {
    const options: ConversionOptions = {
      targetFormat: requirements.preferredFormats[0],
      quality: requirements.compression || 90,
      maxWidth: requirements.maxResolution.width,
      maxHeight: requirements.maxResolution.height,
      maintainAspectRatio: true,
      backgroundColor: requirements.backgroundColor === 'white' ? '#ffffff' : undefined,
      removeBackground: requirements.special?.backgroundRemoval || false,
      enhanceContrast: requirements.special?.enhanceContrast || false,
      grayscale: requirements.special?.grayscale || false
    };
    
    return this.convertImage(file, options);
  }
  
  /**
   * Resize image to specific dimensions
   */
  static async resizeImage(file: File, targetWidth: number, targetHeight: number, maintainAspectRatio = true): Promise<File> {
    const options: ConversionOptions = {
      maxWidth: targetWidth,
      maxHeight: targetHeight,
      maintainAspectRatio,
      quality: 90
    };
    
    return this.convertImage(file, options);
  }
  
  /**
   * Compress image to reduce file size
   */
  static async compressImage(file: File, quality: number, maxSizeMB?: number): Promise<File> {
    let currentQuality = quality;
    let result = await this.convertImage(file, { quality: currentQuality });
    
    // If max size is specified, iteratively reduce quality until target is met
    if (maxSizeMB) {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      let attempts = 0;
      
      while (result.size > maxSizeBytes && currentQuality > 10 && attempts < 10) {
        currentQuality = Math.max(10, currentQuality - 10);
        result = await this.convertImage(file, { quality: currentQuality });
        attempts++;
      }
    }
    
    return result;
  }
  
  /**
   * Remove image background (basic implementation)
   */
  private static async removeBackground(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Simple background removal - replace near-white pixels with pure white
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // If pixel is close to white (background), make it pure white
      if (r > 200 && g > 200 && b > 200) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Apply image effects like contrast enhancement and grayscale
   */
  private static async applyImageEffects(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    options: ConversionOptions
  ): Promise<void> {
    if (!options.enhanceContrast && !options.grayscale) return;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Apply grayscale
      if (options.grayscale) {
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        r = g = b = gray;
      }
      
      // Enhance contrast
      if (options.enhanceContrast) {
        const contrast = 1.2; // 20% contrast increase
        r = Math.min(255, Math.max(0, (r - 128) * contrast + 128));
        g = Math.min(255, Math.max(0, (g - 128) * contrast + 128));
        b = Math.min(255, Math.max(0, (b - 128) * contrast + 128));
      }
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Calculate target dimensions based on constraints
   */
  private static calculateTargetDimensions(
    originalWidth: number,
    originalHeight: number,
    options: ConversionOptions
  ): { width: number; height: number } {
    let { maxWidth, maxHeight } = options;
    
    if (!maxWidth && !maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }
    
    maxWidth = maxWidth || originalWidth;
    maxHeight = maxHeight || originalHeight;
    
    if (!options.maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }
    
    const aspectRatio = originalWidth / originalHeight;
    
    // Calculate dimensions that fit within constraints while maintaining aspect ratio
    let targetWidth = maxWidth;
    let targetHeight = maxWidth / aspectRatio;
    
    if (targetHeight > maxHeight) {
      targetHeight = maxHeight;
      targetWidth = maxHeight * aspectRatio;
    }
    
    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight)
    };
  }
  
  /**
   * Load image from file
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Convert canvas to blob
   */
  private static canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        mimeType,
        quality
      );
    });
  }
  
  /**
   * Get file extension from MIME type
   */
  private static getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/tiff': 'tiff',
      'image/bmp': 'bmp'
    };
    return extensions[mimeType] || 'jpg';
  }
  
  /**
   * Get image dimensions without loading into canvas
   */
  static getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  }
}

export default ImageConverter;