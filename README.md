# PAS Scanner

A web application designed to scan Indonesian airport security passes (PAS Bandara) using a device's camera. It leverages offline, browser-based Optical Character Recognition (OCR) to extract personnel information and presents it in an interactive dashboard.

## Features

-   **Real-time Camera Scanning**: Uses the device's camera to find and capture an ID card automatically.
-   **Manual File Upload**: Allows users to upload an image of an ID card for processing.
-   **Offline OCR Processing**: Employs Tesseract.js to perform OCR directly in the browser, ensuring data privacy and offline functionality.
-   **Advanced Image Pre-processing**: Utilizes Otsu's binarization method to significantly improve OCR accuracy by creating a clean, high-contrast image.
-   **Intelligent Data Parsing**: Smartly parses the raw OCR text to extract structured data like Name, ID Number, Company, Expiry Date, and Access Areas.
-   **Interactive Dashboard**: Displays key statistics from the scans.
-   **Dynamic Filtering**: Features a date range picker and an interactive "Scans per Area" chart to filter the scan history table.
-   **Responsive Design**: Fully responsive layout for both desktop and mobile devices, built with Tailwind CSS.
-   **Modern UI/UX**: A clean, dark-themed interface for a professional feel.

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **OCR Engine**: Tesseract.js
-   **QR/Barcode Detection**: jsQR (used to automatically trigger the capture)
-   **Dependencies**: All major libraries are loaded via CDN and ES modules for a lightweight, build-free setup.

## How It Works

1.  The user selects a scanning area.
2.  The camera view opens, searching for a QR code on the ID card (this acts as a stable target to trigger the capture).
3.  Once detected, a snapshot is taken.
4.  The image is pre-processed in-browser: converted to grayscale, and an optimal black-and-white threshold is applied using Otsu's method.
5.  The cleaned image is passed to Tesseract.js for OCR.
6.  The resulting raw text is parsed by custom logic to identify and extract relevant fields.
7.  The structured data is displayed to the user and added to the dashboard's history.

## Getting Started

### Prerequisites

You need a local web server to run this project, as browsers restrict `file://` access for features like camera and modules. See `requirements.txt` for details.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/pas-scanner.git
    ```
2.  Navigate into the project directory:
    ```bash
    cd pas-scanner
    ```

### Running the Application

This project is a static site and does not require a complex build process. You just need to serve the files.

**Using Node.js (Recommended):**
If you have Node.js installed, you can use the `serve` package.

```bash
# Run this command from the project's root directory
npx serve .
```

Then, open your browser and go to the URL provided by the `serve` command (usually `http://localhost:3000`).

**Using Python:**
If you have Python installed, you can use its built-in HTTP server.

```bash
# Run this command from the project's root directory
# For Python 3
python -m http.server
```

Then, open your browser and go to `http://localhost:8000`.

## Project Structure

```
/
├── components/         # React components for different parts of the UI
├── contexts/           # React context providers (e.g., for notifications)
├── services/           # Business logic (OCR processing, parsing)
├── index.html          # Main HTML file, loads scripts and styles
├── index.tsx           # Main React entry point
├── types.ts            # TypeScript type definitions
├── metadata.json       # Application metadata
├── README.md           # This file
└── requirements.txt    # Development environment requirements
```

## License

This project is licensed under the MIT License.
