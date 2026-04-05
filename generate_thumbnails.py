import os
import fitz # PyMuPDF
from PIL import Image
import io

# Source and destination directories
SOURCE_DIR = os.path.expanduser("~/Desktop/portfolio-2026-pdfs-screenshots/")
THUMBNAIL_DIR = os.path.expanduser("~/Desktop/pdf_thumbnails/")

def generate_thumbnails():
    # Ensure destination exists
    os.makedirs(THUMBNAIL_DIR, exist_ok=True)
    
    # Get all PDF files
    try:
        pdf_files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith('.pdf')]
    except FileNotFoundError:
        print(f"Directory not found: {SOURCE_DIR}")
        return

    print(f"Found {len(pdf_files)} PDFs. Generating thumbnails...")

    for filename in pdf_files:
        filepath = os.path.join(SOURCE_DIR, filename)
        try:
            # Open PDF
            doc = fitz.open(filepath)
            
            if len(doc) == 0:
                print(f"Skipping {filename}: No pages.")
                continue

            # Load first page (index 0)
            page = doc.load_page(0)
            
            # Render to pixmap (moderate resolution for a thumbnail)
            matrix = fitz.Matrix(0.5, 0.5) 
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            
            # Convert to PIL Image
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            
            # Save thumbnail
            thumb_filename = f"{os.path.splitext(filename)[0]}.png"
            thumb_filepath = os.path.join(THUMBNAIL_DIR, thumb_filename)
            img.save(thumb_filepath, "PNG")
            
            print(f"Generated thumbnail for: {filename}")
            
            doc.close()
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    generate_thumbnails()
    print(f"\nFinished. Thumbnails saved to: {THUMBNAIL_DIR}")
