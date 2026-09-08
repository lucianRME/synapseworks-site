# Privacy and data handling

The [RME PDF Scanner Privacy Policy](https://synapseworks.org/rme-pdf-scanner/privacy/) is the canonical public policy for the Android application. This page is a documentation summary; if the summary and the policy ever differ, use the policy and report the discrepancy to SynapseWorks.

## RME PDF Scanner does not operate

- an account or login system;
- advertising;
- tracking or analytics;
- a proprietary document backend or cloud storage service;
- a persistent in-app document library.

Document images, OCR text, and searchable-PDF content are processed on the device. RME PDF Scanner does not send that document content to a proprietary server.

## Android and external components

- RME PDF Scanner declares no direct `INTERNET` permission.
- RME PDF Scanner does not request camera permission directly; camera scanning is provided through ML Kit Document Scanner.
- Files are exported through Android SAF or shared through the Android Sharesheet after an explicit user action.
- External storage providers, viewers, and share targets operate under their own terms and privacy policies.
- Temporary app-private files may exist while processing or sharing is in progress.

## ML Kit diagnostics

Google ML Kit documents document and OCR content processing as on-device. The SDK may nevertheless transmit encrypted technical diagnostics, such as device/app information, configuration, performance or error data, and installation identifiers, according to Google’s current disclosure. This is SDK behavior rather than RME PDF Scanner-operated analytics, and it does not include document content.

Read the official [ML Kit data-disclosure guidance](https://developers.google.com/ml-kit/android-data-disclosure) and [ML Kit terms and privacy information](https://developers.google.com/ml-kit/terms).

## Website privacy is separate

The SynapseWorks website has separate [privacy](https://synapseworks.org/privacy/) and [cookie](https://synapseworks.org/cookie-policy/) policies. Those policies govern website visits; they do not turn RME PDF Scanner into a tracking or analytics product.

The RME PDF Scanner website may also offer an optional iOS-interest signal. It stores an anonymous timestamped interest row and, only if you choose to provide it, an email address for a possible iOS beta notification. This website feature is separate from the Android app; see the [RME PDF Scanner Privacy Policy](https://synapseworks.org/rme-pdf-scanner/privacy/) for the full disclosure.

## Questions

- Support: [support@synapseworks.org](mailto:support@synapseworks.org)
- Security: [security@synapseworks.org](mailto:security@synapseworks.org)
- [Support page](https://synapseworks.org/support/)
- [Security page](https://synapseworks.org/security/)
