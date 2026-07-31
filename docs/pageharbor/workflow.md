# Scanning and export workflow

PageHarbor keeps the document workflow local and leaves destination choices to Android.

## Capture

- Start a scan through Google ML Kit Document Scanner.
- Capture up to 10 pages in one scanner session.
- Import pages from the gallery when you already have page images.

The scanner component supplies the camera interaction. PageHarbor does not request camera permission directly.

## Outputs

| Output | Where it is prepared | How it leaves PageHarbor |
| --- | --- | --- |
| Normal PDF | On the device | Saved to a destination selected through Android SAF |
| JPEG page | On the device | Saved to a destination selected through Android SAF |
| Recognized text | On the device, in the active session | Copied to the Android clipboard only after **Copy Text** |
| Searchable PDF | Generated locally on the device | Saved through Android SAF or shared through Android |

PageHarbor does not upload document images, OCR text, or generated PDF content to a PageHarbor backend. It has no PageHarbor backend or proprietary cloud storage service.

## Save with Android SAF

Android’s Storage Access Framework lets you choose where an exported file is saved. The selected destination may be local storage or an installed external storage provider. PageHarbor does not receive the provider’s account credentials and does not control that provider’s retention or privacy practices.

## Share with Android

Choose Share to open Android’s Sharesheet, then choose the receiving app. The external app receives the file only after that user action and handles it under its own policies.

## Searchable-PDF filenames

PageHarbor can suggest a filename based on a deterministic broad document category. The suggestion is not a document library, an automatic rename, or a record of document contents. Android’s file picker/provider remains authoritative for the final name and destination.

## Temporary processing files

PageHarbor may create temporary app-private files for processing or sharing. These files are not presented as a persistent document library. Refer to the [PageHarbor privacy policy](https://synapseworks.org/pageharbor/privacy/) for the current retention and cleanup description.
