import { IdCardData } from '../types';

// Kamus untuk memperbaiki kesalahan OCR umum
const corrections: { [key: string]: string } = {
    'PT ANGKAS': 'PT ANGKASA PURA',
    'ANGKASA PU': 'PT ANGKASA PURA',
    'KANTOM': 'KANTOR',
};

// Helper function untuk membersihkan teks dari karakter noise
const cleanLine = (line: string): string => {
    return line.replace(/^[=:\-_\s]+|[=\-_\s]+$/g, '').trim();
};

/**
 * Membersihkan bidang dari artefak OCR umum di bagian akhir dengan lebih agresif dan berulang.
 * @param value String yang akan dibersihkan.
 * @returns String yang telah dibersihkan.
 */
const cleanFinalField = (value: string | undefined): string => {
    if (!value) return '';

    let words = value.trim().split(/\s+/);
    
    // Terus hapus kata terakhir selama itu adalah "sampah"
    while (words.length > 1) {
        const lastWord = words[words.length - 1];
        // Aturan sampah: bukan hanya huruf (mengandung simbol/angka), ATAU terlalu panjang.
        const isGarbage = !/^[A-Z]+$/i.test(lastWord) || lastWord.length > 8;

        if (isGarbage) {
            words.pop(); // Hapus kata sampah
        } else {
            break; // Kata terakhir valid, berhenti membersihkan
        }
    }
    return words.join(' ');
};

export const parseOcrResult = (text: string): Omit<IdCardData, 'scanArea' | 'scanTimestamp'> => {
    const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length < 50); // Filter out very long garbage lines

    const data: Partial<IdCardData> = { accessAreas: [] };

    // --- Pass 1: Find major landmark indices ---
    const areaLineIndex = lines.findIndex(line => line.toUpperCase().includes('AREA'));
    const companyLineIndex = lines.findIndex(line => line.toUpperCase().startsWith('PT'));
    let nameLineIndex = -1;

    // Infer name index: usually 2 lines above company
    if (companyLineIndex > 1) {
        nameLineIndex = companyLineIndex - 2;
    } else {
        // Fallback if company is not found or too high up
        nameLineIndex = lines.findIndex((line, idx) => {
            const upperLine = line.toUpperCase();
            const words = line.split(/\s+/);
            const containsNameLikeWords = words.some(w => w.length > 2); // Hindari baris seperti "A B C"
            return (
                idx > areaLineIndex &&
                words.length >= 2 && words.length <= 4 &&
                containsNameLikeWords &&
                !upperLine.startsWith('PT') && !upperLine.includes('HEAD') && !upperLine.includes('CENTER')
            );
        });
    }

    // --- Pass 2: Process Area Zone with aggressive character-by-character extraction ---
    if (areaLineIndex !== -1 && nameLineIndex !== -1 && areaLineIndex < nameLineIndex) {
        const areaZoneLines = lines.slice(areaLineIndex + 1, nameLineIndex);
        areaZoneLines.forEach(line => {
            // Iterasi setiap karakter dalam baris untuk menemukan SEMUA huruf area.
            for (const char of line) {
                // Jika karakter adalah huruf kapital tunggal, tambahkan.
                if (char >= 'A' && char <= 'Z') {
                    if (!(data.accessAreas as string[]).includes(char)) {
                        (data.accessAreas as string[]).push(char);
                    }
                }
            }
        });
    }

    // --- Pass 3: Extract main information using relative positions and keywords ---
    const usedLines = new Set<number>();

    // Header info
    const authorityLine = lines.find(line => line.toUpperCase().includes('OTORITAS'));
    if (authorityLine) data.issuingAuthority = cleanLine(authorityLine).replace(/^(Co|Lo)\s/i, '');
    const locationLine = lines.find(line => line.toUpperCase().includes('BANDAR UDARA'));
    if (locationLine) data.location = cleanLine(locationLine).replace(/^[/\s(0;):]+/, '');
    
    // Expiry date from the AREA line
    if (areaLineIndex !== -1) {
        const expiryMatch = lines[areaLineIndex].match(/\d{1,2}\s+(JAN|FEB|MAR|APR|MEI|JUN|JUL|AGU|SEP|OKT|NOV|DES)\s+\d{4}/i);
        if (expiryMatch) data.expiryDate = expiryMatch[0].toUpperCase();
    }

    // Main data block relative to company
    if (companyLineIndex !== -1) {
        data.company = cleanLine(lines[companyLineIndex]);
        usedLines.add(companyLineIndex);
        if (companyLineIndex > 0 && !usedLines.has(companyLineIndex - 1)) {
            data.position = cleanLine(lines[companyLineIndex - 1]);
            usedLines.add(companyLineIndex - 1);
        }
        if (companyLineIndex > 1 && !usedLines.has(companyLineIndex - 2)) {
            data.name = cleanLine(lines[companyLineIndex - 2]);
            usedLines.add(companyLineIndex - 2);
        }
    }
    
    // ID Number from the bottom up (most reliable)
    for (let i = lines.length - 1; i >= 0; i--) {
        if (usedLines.has(i)) continue;
        const line = lines[i];
        const match = line.match(/\b([A-Z\s\.]*\d[\d\.]*)/i);
        if (match) {
            let id = match[0].split(/(\s{2,}|[a-z]{3,})/)[0].trim().replace(/\s/g, '');
            if ((id.match(/\./g) || []).length >= 2 && id.length > 10) {
                 data.idNumber = id;
                 break;
            }
        }
    }
    
    // --- Pass 4: Final Cleanup and Correction ---
    data.name = cleanFinalField(data.name);
    data.position = cleanFinalField(data.position);
    data.company = cleanFinalField(data.company);

    if (data.company) {
        Object.keys(corrections).forEach(key => {
            if (data.company && data.company.toUpperCase().includes(key)) {
                data.company = corrections[key];
            }
        });
    }

    if (data.idNumber && data.idNumber.startsWith('BAPSTN')) {
        data.idNumber = data.idNumber.replace('BAPSTN', 'B.AP.STN');
    }

    return {
        issuingAuthority: data.issuingAuthority || 'KANTOR OTORITAS',
        location: data.location || 'BANDAR UDARA',
        expiryDate: data.expiryDate || 'N/A',
        accessAreas: data.accessAreas || [],
        name: data.name || 'Not Found',
        position: data.position || 'Not Found',
        company: data.company || 'Not Found',
        idNumber: data.idNumber || 'Not Found',
    };
};