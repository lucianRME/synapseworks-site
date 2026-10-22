# Privacy and data handling

The [RME: Private PDF Scanner Privacy Policy](https://synapseworks.org/rme-pdf-scanner/privacy/) is the canonical public policy for the Android application. This page is a summary; report any discrepancy to SynapseWorks.

## Local document data

Scans, imported pages, OCR, and searchable-PDF content are processed on the device. When you choose **Save to RME**, pages, thumbnails, metadata, and OCR text you have generated can remain in an app-private local library. RME has no document backend, proprietary cloud storage or sync, account system, advertising, or RME-operated tracking or analytics service. It does not send library content to an RME server.

An unsaved active session is temporary. Deleting a saved document removes RME's private copy and indexed text, while leaving any independently imported source file with its original provider. Android automatic backup and device transfer are disabled for private app data. A separate user-initiated portable backup can preserve the complete library and can optionally be encrypted with a password.

## Android and outside services

- RME's current manifest requests neither `INTERNET` nor `ACCESS_NETWORK_STATE`, and declares no broad storage access.
- Camera scanning is supplied by Google ML Kit Document Scanner; RME does not request camera permission directly.
- Android's system picker provides imports and export destinations, and the Sharesheet provides incoming supported files and outgoing shares.
- External providers, viewers, and share targets operate under their own terms and privacy policies.

Google ML Kit documents document and OCR content processing as on-device. Latin OCR is bundled; additional Chinese, Japanese, Korean, and Devanagari OCR models may be downloaded by Google Play services. The SDK may transmit encrypted technical diagnostics such as device and app information, configuration, performance or error data, and installation identifiers. This is separate from RME-operated analytics and does not include document content according to Google's disclosure. Google Play services may need network access to obtain or update scanner components and optional OCR models.

Read the official [ML Kit data-disclosure guidance](https://developers.google.com/ml-kit/android-data-disclosure) and [ML Kit terms and privacy information](https://developers.google.com/ml-kit/terms).

## Website privacy is separate

The SynapseWorks website has separate [privacy](https://synapseworks.org/privacy/) and [cookie](https://synapseworks.org/cookie-policy/) policies. Its optional iOS-interest signal is a website feature, separate from the Android app; see the [product privacy policy](https://synapseworks.org/rme-pdf-scanner/privacy/) for the disclosure.

For questions, contact [support@synapseworks.org](mailto:support@synapseworks.org) or [security@synapseworks.org](mailto:security@synapseworks.org).
