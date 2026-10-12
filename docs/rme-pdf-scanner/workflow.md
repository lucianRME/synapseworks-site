# Scanning, library, and export workflow

RME PDF Scanner processes documents locally and leaves external file choices to Android's system picker and Sharesheet.

## Bring pages into RME

- Capture pages through Google ML Kit Document Scanner. The scanner owns the camera interaction; RME does not request camera permission directly.
- Import one or more JPEG, PNG, WebP, or PDF files through Android's picker, including files selected through the guided scanner-migration workflow.
- Receive supported images or PDFs from another app through Android sharing.

Interactive paper capture supports up to 20 pages; ordinary file import and migration can preserve longer documents within RME's safety limits. You can review, reorder, rotate, remove, add, and filter pages before saving or export. PDF import uses temporary app-private copies and rendered pages during preparation.

## Save and organize locally

**Save to RME** keeps a private copy of pages, source assets required for portability, thumbnails, document metadata, recognized text, and saved corrections. Saved documents can be reopened, renamed, moved into folders or subfolders, searched across the full library, sorted, and edited. Merge saved documents in a chosen order, or extract or move selected pages to make a new document. Deleting RME's copy does not delete an imported source file.

RME does not upload this library to an RME server or provide proprietary cloud sync. Android automatic backup and device transfer are disabled for app-private data. A separate user-initiated portable backup can preserve the complete library, can be password-encrypted, and can be restored on another phone through files you select with Android's system picker.

## Create outputs

| Output | Where it is prepared | How it leaves RME PDF Scanner |
| --- | --- | --- |
| Standard PDF | On the device | Saved through Android's system picker or shared through Android's Sharesheet |
| Searchable PDF | Generated on the device from OCR text | Saved through Android's system picker |
| JPEG page | On the device | Saved through Android's system picker |
| Recognized text | On the device | Copied to the Android clipboard after **Copy Text** |

For a copy you intend to send, **Share-Safe** can apply irreversible blackout redaction and a purpose or date watermark. Direct redaction drag, fit-relative zoom and pan, and the final preview help you inspect the separate output before Save or Share. **Fit Upload Limit** can prepare PDFs toward 200 KB, 500 KB, 1 MB, 2 MB, or a custom target; readable quality and document complexity mean not every target can be reached. **ID / Card Copy** can place a card's front and back on A4 or Letter paper in Auto, Vertical, or Horizontal layouts, with optional redaction.

An external storage provider or share target may handle a file you choose to give it. RME does not receive that provider's account credentials or control its retention practices.

Temporary files used for imports, prepared outputs, and shares are cleaned according to the [RME PDF Scanner privacy policy](https://synapseworks.org/rme-pdf-scanner/privacy/).
