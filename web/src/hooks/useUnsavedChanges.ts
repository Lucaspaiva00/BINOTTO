import { useCallback, useEffect, useRef, useState } from "react";

const MESSAGE = "Existem alterações não salvas. Deseja sair sem salvar?";

export function useUnsavedChanges(initialDirty = false) {
  const [dirty, setDirty] = useState(initialDirty);
  const dirtyRef = useRef(dirty);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  useEffect(() => {
    if (!dirty) return;

    const originalPush = window.history.pushState.bind(window.history);
    const originalReplace = window.history.replaceState.bind(window.history);

    const guardedPush: History["pushState"] = (data, unused, url) => {
      if (!dirtyRef.current || window.confirm(MESSAGE)) {
        dirtyRef.current = false;
        setDirty(false);
        originalPush(data, unused, url);
      }
    };

    const guardedReplace: History["replaceState"] = (data, unused, url) => {
      if (!dirtyRef.current || window.confirm(MESSAGE)) {
        dirtyRef.current = false;
        setDirty(false);
        originalReplace(data, unused, url);
      }
    };

    window.history.pushState = guardedPush;
    window.history.replaceState = guardedReplace;

    const handlePopState = () => {
      if (!dirtyRef.current) return;
      if (window.confirm(MESSAGE)) {
        dirtyRef.current = false;
        setDirty(false);
        return;
      }
      // O popstate já alterou a posição do histórico. Volta para a tela atual.
      window.history.forward();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [dirty]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
  }, []);

  const markSaved = useCallback(() => {
    dirtyRef.current = false;
    setDirty(false);
  }, []);

  const confirmDiscard = useCallback(() => !dirtyRef.current || window.confirm(MESSAGE), []);

  return { dirty, markDirty, markSaved, confirmDiscard };
}
