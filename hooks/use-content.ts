import { useState, useCallback } from "react";

export function useContent<T>(initialContent: T) {
  const [content, setContent] = useState<T>(initialContent);

  const updateContent = useCallback((key: keyof T, value: any) => {
    setContent((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetContent = useCallback(() => {
    setContent(initialContent);
  }, [initialContent]);

  const setContentDirectly = useCallback((newContent: T) => {
    setContent(newContent);
  }, []);

  return {
    content,
    updateContent,
    resetContent,
    setContentDirectly,
  };
}

