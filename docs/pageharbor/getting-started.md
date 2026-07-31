# Getting started

PageHarbor is currently being prepared for controlled Google Play internal testing. There is no public Google Play install link yet, and this page does not promise a release date.

## Before testing

- Use an Android device running API level 26 or later.
- Use non-sensitive sample documents for testing.
- A single scanner session supports up to 10 pages.
- The scanner flow is provided through Google ML Kit Document Scanner.

## A typical session

1. Start a document scan in PageHarbor.
2. Capture pages through the Android scanner workflow, or import pages from the gallery.
3. Choose the output you need: a normal PDF, individual JPEG pages, recognized text, or a searchable PDF.
4. For a PDF or JPEG export, choose the destination in Android’s system file picker.
5. To share a PDF, choose Share and select a receiving app in the Android Sharesheet.

PageHarbor does not operate a document library or cloud storage service. The destination provider or receiving app handles a file after you choose it.

## OCR and text

PageHarbor includes bundled Latin-script OCR that runs on the device. Recognized text remains an active-session result unless you explicitly choose **Copy Text**. Copying places the text on the Android clipboard, where Android and other apps may affect access or retention.

## Searchable PDFs

PageHarbor can generate a searchable PDF locally from a scan and its recognized text. The searchable text layer is created on the device before you choose a save destination through SAF.

## Current availability

Internal testing preparation is not public availability. Do not describe PageHarbor as downloadable from Google Play until SynapseWorks publishes an official release link.
