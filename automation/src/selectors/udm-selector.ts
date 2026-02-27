export default {
  StrongInside:
    "#axis-main-content > ss-app > div > div > ss-survey-cycle > div",

  ElementsContainer: "#element-properties-container",
  ElementStatus: ".element-status",
  // status class names used by the app
  STATUS_SELECTOR: ".element-status",
  STATUS_APPROVED_CLASS: "status-approved",
  STATUS_PENDING_CLASS: "status-pending",
  STATUS_DRAFT_CLASS: "status-draft",

  lng_sel: "#element-properties-container div.language-selector",
  lng_list_sel: ".p-select-list", // container for language <li> options

  dialogSel:
    "cdk-overlay-container .mat-mdc-dialog-container, cdk-overlay-container mat-dialog-container, .mat-mdc-dialog-container, mat-dialog-container",

  applicabilitiesTab: "#element-properties-aplicability",

  btnUnlock: "#btn-unlock",
  btnSave: "#btn-save-element-properties",
  btnApprove: "#btn-approve",
  btnSubmitForReview: "#btn-submit-for-approval",

  attrElemNameInput: "#element-name",
  attrFieldNameInput: "#field-name",

  spinner: ".ngx-spinner-overlay",

  elementsContainer:
    "#axis-main-content > ss-app > div > div > ss-elements > div",

  elementsGrid:
    "#survey-cycle-organization-grid > div.ag-root-wrapper.ag-layout-normal.ag-ltr",

  elementsGridIncumbent:
    "#survey-cycle-incumbent-grid > div.ag-root-wrapper.ag-layout-normal.ag-ltr",

  elementsGridFallback:
    "#axis-main-content > ss-app > div > div > ss-elements > div .ag-root-wrapper.ag-layout-normal.ag-ltr",

  elementsGridFilterInput:
    'input[data-ref="eInput"][aria-label="Field / Element Name Filter Input"]',

  elementsGridRowViewport: ".ag-center-cols-viewport",
  elementsGridRow: ".ag-center-cols-container .ag-row",
  elementsGridFirstColumn: '[col-id="elementName"]',
  elementsGridFirstColumnFieldName: '[col-id="elementName"] strong',
  elementsGridFirstColumnElementName: '[col-id="elementName"] small',
};
