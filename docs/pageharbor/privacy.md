# Privacy and data handling

The [PageHarbor Privacy Policy](https://synapseworks.org/pageharbor/privacy/) is the canonical public policy for the Android application. This page is a documentation summary; if the summary and the policy ever differ, use the policy and report the discrepancy to SynapseWorks.

## PageHarbor does not operate

- an account or login system;
- advertising;
- PageHarbor tracking or analytics;
- a PageHarbor backend or proprietary cloud storage service;
- a persistent PageHarbor document library.

Document images, OCR text, and searchable-PDF content are processed on the device. PageHarbor does not send that document content to a PageHarbor server.

## Android and external components

- PageHarbor declares no direct `INTERNET` permission.
- PageHarbor does not request camera permission directly; camera scanning is provided through ML Kit Document Scanner.
- Files are exported through Android SAF or shared through the Android Sharesheet after an explicit user action.
- External storage providers, viewers, and share targets operate under their own terms and privacy policies.
- Temporary app-private files may exist while processing or sharing is in progress.

## ML Kit diagnostics

Google ML Kit documents document and OCR content processing as on-device. The SDK may nevertheless transmit encrypted technical diagnostics, such as device/app information, configuration, performance or error data, and installation identifiers, according to Google’s current disclosure. This is SDK behavior rather than PageHarbor-operated analytics, and it does not include document content.

Read the official [ML Kit data-disclosure guidance](https://developers.google.com/ml-kit/android-data-disclosure) and [ML Kit terms and privacy information](https://developers.google.com/ml-kit/terms).

## Website privacy is separate

The SynapseWorks website has separate [privacy](https://synapseworks.org/privacy/) and [cookie](https://synapseworks.org/cookie-policy/) policies. Those policies govern website visits; they do not turn PageHarbor into a tracking or analytics product.

The PageHarbor website may also offer an optional iOS-interest signal. It stores an anonymous timestamped interest row and, only if you choose to provide it, an email address for a possible iOS beta notification. This website feature is separate from the Android app; see the [PageHarbor Privacy Policy](https://synapseworks.org/pageharbor/privacy/) for the full disclosure.

## Questions

- Support: [support@synapseworks.org](mailto:support@synapseworks.org)
- Security: [security@synapseworks.org](mailto:security@synapseworks.org)
- [Support page](https://synapseworks.org/support/)
- [Security page](https://synapseworks.org/security/)
