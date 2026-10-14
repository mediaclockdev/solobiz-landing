"use client";
import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQRCodeWithLogo(
  text: string,
  logoFile?: File | null,
  options: QRCodeOptions = {}
): Promise<string> {
  // Create options object with explicit properties to ensure color is properly applied
  const defaultOptions = {
    width: options.width || 200,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000', // Default to black if no color provided
      light: options.color?.light || '#FFFFFF', // Default to white background
    }
  };

  try {
    // Generate base QR code
    // Explicitly pass the color options to ensure they're applied
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: defaultOptions.width,
      margin: defaultOptions.margin,
      color: {
        dark: defaultOptions.color.dark,
        light: defaultOptions.color.light
      }
    });

    // If no logo, return the base QR code
    if (!logoFile) {
      return qrDataUrl;
    }

    // Create canvas for combining QR code and logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Load QR code image
    const qrImage = new Image();
    qrImage.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      qrImage.onload = () => {
        canvas.width = qrImage.width;
        canvas.height = qrImage.height;
        
        // Draw QR code
        ctx.drawImage(qrImage, 0, 0);
        
        // Load and draw logo
        const logoImage = new Image();
        const logoUrl = URL.createObjectURL(logoFile);
        
        logoImage.onload = () => {
          // Calculate logo size (20% of QR code size)
          const logoSize = Math.min(canvas.width, canvas.height) * 0.2;
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = (canvas.height - logoSize) / 2;
          
          // Create white background square for logo
          const backgroundSize = logoSize * 1.2;
          const backgroundX = (canvas.width - backgroundSize) / 2;
          const backgroundY = (canvas.height - backgroundSize) / 2;
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(backgroundX, backgroundY, backgroundSize, backgroundSize);
          
          // Draw logo in square
          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
          
          // Clean up logo URL
          URL.revokeObjectURL(logoUrl);
          
          // Return final image
          resolve(canvas.toDataURL('image/png'));
        };
        
        logoImage.onerror = () => {
          URL.revokeObjectURL(logoUrl);
          reject(new Error('Failed to load logo image'));
        };
        
        logoImage.src = logoUrl;
      };
      
      qrImage.onerror = () => {
        reject(new Error('Failed to load QR code image'));
      };
      
      qrImage.src = qrDataUrl;
    });
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw error;
  }
}