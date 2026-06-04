import os
from pypdf import PdfWriter, PdfReader

class PdfService:
    @staticmethod
    def merge_pdfs(input_paths: list[str], output_path: str) -> dict:
        """
        Menggabungkan beberapa file PDF menjadi satu file.
        Mengembalikan dictionary berisi informasi metrik ukuran file.
        """
        merger = PdfWriter()
        total_original_size = 0
        
        try:
            for path in input_paths:
                total_original_size += os.path.getsize(path)
                merger.append(path)
            
            # Write to output file
            merger.write(output_path)
            merger.close()
            
            return {
                "original_size": total_original_size,
                "compressed_size": os.path.getsize(output_path)
            }
        except Exception as e:
            merger.close()
            raise e

pdf_service = PdfService()
