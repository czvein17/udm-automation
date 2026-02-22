import { useEffect } from "react";

const APP_TITLE = "UDM Automation";

export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | ${APP_TITLE}` : APP_TITLE;
  }, [pageTitle]);
}
