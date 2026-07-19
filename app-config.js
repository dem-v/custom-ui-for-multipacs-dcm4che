/**
 * OHIF Viewer configuration for the "xrayservice" gateway.
 *
 * Four dcm4chee PACS live on ${PACS_HOST}, each exposing DICOMweb on its own
 * port. OHIF never talks to them directly: every root below is RELATIVE, so the
 * browser calls this same origin (the nginx reverse proxy in docker-compose.yml)
 * which forwards to the matching PACS port. Same-origin => no CORS problem,
 * identical behaviour over LAN and through the Cloudflare tunnel.
 *
 *   nginx prefix      -> PACS port   AET path (edit AET here if it differs)
 *   /pacs-xray/       -> 8443        /dcm4chee-arc/aets/XRAYPACS/rs
 *   /pacs-ct/         -> 8444        /dcm4chee-arc/aets/CTPACS/rs
 *   /pacs-angio/      -> 8445        /dcm4chee-arc/aets/ANGIOPACS/rs
 *   /pacs-us/         -> 8446        /dcm4chee-arc/aets/USPACS/rs
 *
 * No OIDC block => OHIF launches straight into the study list (no login).
 */
window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  showStudyList: true,
  maxNumberOfWebWorkers: 3,
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  defaultDataSourceName: 'xraypacs',
  dataSources: [
    {
      friendlyName: 'X-Ray — XRAYPACS',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'xraypacs',
      configuration: {
        name: 'XRAYPACS',
        wadoUriRoot: '/pacs-xray/dcm4chee-arc/aets/XRAYPACS/wado',
        qidoRoot: '/pacs-xray/dcm4chee-arc/aets/XRAYPACS/rs',
        wadoRoot: '/pacs-xray/dcm4chee-arc/aets/XRAYPACS/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
        dicomUploadEnabled: false,
        bulkDataURI: { enabled: true, relativeResolution: 'studies' },
      },
    },
    {
      friendlyName: 'CT — CTPACS',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'ctpacs',
      configuration: {
        name: 'CTPACS',
        wadoUriRoot: '/pacs-ct/dcm4chee-arc/aets/CTPACS/wado',
        qidoRoot: '/pacs-ct/dcm4chee-arc/aets/CTPACS/rs',
        wadoRoot: '/pacs-ct/dcm4chee-arc/aets/CTPACS/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
        dicomUploadEnabled: false,
        bulkDataURI: { enabled: true, relativeResolution: 'studies' },
      },
    },
    {
      friendlyName: 'Angio / XA — ANGIOPACS',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'angiopacs',
      configuration: {
        name: 'ANGIOPACS',
        wadoUriRoot: '/pacs-angio/dcm4chee-arc/aets/ANGIOPACS/wado',
        qidoRoot: '/pacs-angio/dcm4chee-arc/aets/ANGIOPACS/rs',
        wadoRoot: '/pacs-angio/dcm4chee-arc/aets/ANGIOPACS/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
        dicomUploadEnabled: false,
        bulkDataURI: { enabled: true, relativeResolution: 'studies' },
      },
    },
    {
      friendlyName: 'Ultrasound — USPACS',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'uspacs',
      configuration: {
        name: 'USPACS',
        wadoUriRoot: '/pacs-us/dcm4chee-arc/aets/USPACS/wado',
        qidoRoot: '/pacs-us/dcm4chee-arc/aets/USPACS/rs',
        wadoRoot: '/pacs-us/dcm4chee-arc/aets/USPACS/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
        dicomUploadEnabled: false,
        bulkDataURI: { enabled: true, relativeResolution: 'studies' },
      },
    },
  ],
  hotkeys: [
    { commandName: 'incrementActiveViewport', label: 'Next Viewport', keys: ['right'] },
    { commandName: 'decrementActiveViewport', label: 'Previous Viewport', keys: ['left'] },
    { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['r'] },
    { commandName: 'rotateViewportCCW', label: 'Rotate Left', keys: ['l'] },
    { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
    { commandName: 'flipViewportVertical', label: 'Flip Horizontally', keys: ['h'] },
    { commandName: 'flipViewportHorizontal', label: 'Flip Vertically', keys: ['v'] },
    { commandName: 'scaleUpViewport', label: 'Zoom In', keys: ['+'] },
    { commandName: 'scaleDownViewport', label: 'Zoom Out', keys: ['-'] },
    { commandName: 'fitViewportToWindow', label: 'Zoom to Fit', keys: ['='] },
    { commandName: 'resetViewport', label: 'Reset', keys: ['space'] },
    { commandName: 'nextImage', label: 'Next Image', keys: ['down'] },
    { commandName: 'previousImage', label: 'Previous Image', keys: ['up'] },
    { commandName: 'previousViewportDisplaySet', label: 'Previous Series', keys: ['pagedown'] },
    { commandName: 'nextViewportDisplaySet', label: 'Next Series', keys: ['pageup'] },
    { commandName: 'setToolActive', commandOptions: { toolName: 'Zoom' }, label: 'Zoom', keys: ['z'] },
    { commandName: 'setToolActive', commandOptions: { toolName: 'Pan' }, label: 'Pan', keys: ['p'] },
    { commandName: 'setToolActive', commandOptions: { toolName: 'WindowLevel' }, label: 'Window Level', keys: ['w'] },
    { commandName: 'setToolActive', commandOptions: { toolName: 'StackScroll' }, label: 'Scroll', keys: ['s'] },
    { commandName: 'setToolActive', commandOptions: { toolName: 'Length' }, label: 'Length', keys: ['m'] },
    { commandName: 'toggleMoreMenu', label: 'Show / Hide More Menu', keys: ['y'] },
  ],
};
