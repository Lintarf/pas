import { IdCardData } from '../types';
import { parseOcrResult } from './ocrParser';

// Tesseract di-load dari tag script di index.html
declare const Tesseract: any;

/**
 * Menerapkan pra-pemrosesan gambar tingkat lanjut menggunakan metode Otsu untuk binarisasi adaptif.
 * Ini secara signifikan meningkatkan akurasi OCR dengan menciptakan gambar hitam-putih yang sangat bersih.
 * @param imageDataUrl Data URL dari gambar yang akan diproses.
 * @returns Promise yang resolve ke data URL dari gambar yang telah diproses.
 */
const preprocessImage = async (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error('Could not get canvas context'));

            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const histogram = new Array(256).fill(0);
            const totalPixels = imageData.width * imageData.height;

            // Langkah 1: Konversi ke Grayscale (menggunakan metode luminositas) & buat histogram
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                histogram[gray]++;
                // Simpan nilai grayscale di channel merah untuk digunakan nanti
                data[i] = gray; 
            }

            // Langkah 2: Hitung ambang batas Otsu
            let sum = 0;
            for (let i = 0; i < 256; i++) {
                sum += i * histogram[i];
            }

            let sumB = 0;
            let wB = 0;
            let wF = 0;
            let mB = 0;
            let mF = 0;
            let max = 0;
            let threshold = 0;

            for (let t = 0; t < 256; t++) {
                wB += histogram[t];
                if (wB === 0) continue;

                wF = totalPixels - wB;
                if (wF === 0) break;

                sumB += t * histogram[t];
                mB = sumB / wB;
                mF = (sum - sumB) / wF;

                const between = wB * wF * (mB - mF) * (mB - mF);
                if (between > max) {
                    max = between;
                    threshold = t;
                }
            }
            
            console.log(`Optimal threshold found via Otsu's method: ${threshold}`);

            // Langkah 3: Terapkan ambang batas (Binarisasi)
            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i]; // Ambil nilai grayscale yang disimpan
                const color = gray > threshold ? 255 : 0;
                data[i] = color;
                data[i + 1] = color;
                data[i + 2] = color;
            }
            
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = (err) => reject(err);
        image.src = imageDataUrl;
    });
};


export const processImageWithOCR = async (imageDataUrl: string): Promise<Omit<IdCardData, 'scanArea' | 'scanTimestamp'>> => {
    try {
        if (typeof Tesseract === 'undefined') {
            throw new Error("Tesseract.js library not loaded. Cannot perform OCR.");
        }
        
        console.log("Starting offline OCR process with advanced pre-processing...");
        
        // Langkah 1: Pra-pemrosesan gambar untuk meningkatkan akurasi
        const processedImageUrl = await preprocessImage(imageDataUrl);

        // Langkah 2: Mengenali teks menggunakan Tesseract.js
        const { data: { text } } = await Tesseract.recognize(
            processedImageUrl,
            'eng', // Bahasa: Inggris
            {
                logger: m => console.log(m), // Opsi untuk melihat progres di konsol
                // Mengatur mode segmentasi halaman ke 4 (Asumsikan satu kolom teks).
                // Ini lebih baik untuk tata letak kartu ID daripada psm_6 atau psm_3.
                psm: 'psm_4',
                // Whitelist karakter untuk mencegah OCR "berhalusinasi" menghasilkan simbol aneh.
                // Ini secara drastis meningkatkan akurasi untuk dokumen terstruktur.
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789. '
            }
        );

        if (!text) {
            throw new Error("Tesseract could not extract any text. The image may be too blurry or low quality.");
        }
        console.log("Raw OCR Text:", text);

        // Langkah 3: Mem-parsing hasil OCR mentah menjadi data terstruktur
        const parsedData = parseOcrResult(text);
         if (!parsedData || !parsedData.name || !parsedData.idNumber || parsedData.idNumber === 'Not Found' || parsedData.name === 'Not Found') {
             throw new Error(`Failed to parse essential information (like name or ID number) from the extracted text. The ID card format might be unrecognized or the image quality is too low.`);
        }

        return parsedData;

    } catch (error) {
        console.error("Image processing with Tesseract failed:", error);
        if (error instanceof Error) {
             throw new Error(`Offline OCR Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred during offline image processing.");
    }
};