# Scanning, library, and export workflow

RME PDF Scanner processes documents locally and leaves external file choices to Android's system picker and Sharesheet.

## Bring pages into RME

- Capture pages through Google ML Kit Document Scanner. The scanner owns the camera interaction; RME does not request camera permission directly.
- Import one or more JPEG, PNG, WebP, or PDF files through Android's picker.
- Receive supported images or PDFs from another app through Android sharing.

The active document supports up to 20 pages. You can review, reorder, rotate, remove, add, and filter pages before saving or export. PDF import uses temporary app-private copies and rendered pages during preparation.

## Save and organize locally

**Save to RME** keeps a private copy of pages, thumbnails, document metadata, and any OCR text you chose to generate. Saved documents can be reopened, renamed, moved into folders, searched, sorted, and edited. Merge saved documents in a chosen order, or extract or move selected pages to make a new document. Deleting RME's copy does not delete an imported source file.

RME does not upload this library to an RME server or provide proprietary cloud sync. Android backup and device transfer are disabled for the app's private data in the current configuration.

## Create outputs

| Output | Where it is prepared | How it leaves RME PDF Scanner |
| --- | --- | --- |
| Standard PDF | On the device | Saved through Android's system picker or shared through Android's Sharesheet |
| Searchable PDF | Generated on the device from OCR text | Saved through Android's system picker |
| JPEG page | On the device | Saved through Android's system picker |
| Recognized text | On the device | Copied to the Android clipboard after **Copy Text** |

An external storage provider or share target may handle a file you choose to give it. RME does not receive that provider's account credentials or control its retention practices.

Temporary files used for imports, prepared outputs, and shares are cleaned according to the [RME PDF Scanner privacy policy](https://synapseworks.org/rme-pdf-scanner/privacy/).
