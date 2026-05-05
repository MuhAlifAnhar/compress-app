import os
import subprocess
from PIL import Image
import math
import numpy as np

class CompressService:
    @staticmethod
    def compress_image(input_path: str, output_path: str, quality: int = 80) -> dict:
        """
        Compresses an image (JPG/PNG) using Pillow.
        """
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if saving as JPEG
            if img.mode in ("RGBA", "P") and output_path.lower().endswith((".jpg", ".jpeg")):
                img = img.convert("RGB")
            
            img.save(output_path, optimize=True, quality=quality)
        
        # Calculate PSNR
        psnr = CompressService._calculate_psnr(input_path, output_path)
        
        return {
            "original_size": os.path.getsize(input_path),
            "compressed_size": os.path.getsize(output_path),
            "psnr": psnr
        }

    @staticmethod
    def compress_pdf(input_path: str, output_path: str, power: str = "recommended") -> dict:
        """
        Compresses a PDF using Ghostscript.
        Powers: extreme (/screen), recommended (/ebook), low (/printer)
        """
        gs_powers = {
            "extreme": "/screen",
            "recommended": "/ebook",
            "low": "/printer"
        }
        
        gs_setting = gs_powers.get(power, "/ebook")
        
        # Ghostscript command for Windows (gswin64c)
        # Note: User must have Ghostscript installed and in PATH
        command = [
            "gswin64c", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={gs_setting}", "-dNOPAUSE", "-dQUIET", "-dBATCH",
            f"-sOutputFile={output_path}", input_path
        ]
        
        try:
            subprocess.run(command, check=True)
        except FileNotFoundError:
            # Fallback for linux or if named 'gs'
            command[0] = "gs"
            subprocess.run(command, check=True)
            
        return {
            "original_size": os.path.getsize(input_path),
            "compressed_size": os.path.getsize(output_path)
        }

    @staticmethod
    def _calculate_psnr(original_path, compressed_path):
        """
        Calculates Peak Signal-to-Noise Ratio (PSNR) between original and compressed images.
        """
        try:
            original = Image.open(original_path).convert("RGB")
            compressed = Image.open(compressed_path).convert("RGB")
            
            # Ensure same size
            if original.size != compressed.size:
                compressed = compressed.resize(original.size)
                
            orig_array = np.array(original)
            comp_array = np.array(compressed)
            
            mse = np.mean((orig_array - comp_array) ** 2)
            if mse == 0:
                return 100
            
            max_pixel = 255.0
            psnr = 20 * math.log10(max_pixel / math.sqrt(mse))
            return round(psnr, 2)
        except Exception as e:
            print(f"Error calculating PSNR: {e}")
            return 0

compress_service = CompressService()
