import { type DocumentActionComponent, useValidationStatus } from "sanity";

/**
 * Custom publish actions bypass the validation gate of Sanity's built-in
 * Publish button, so each one must check it itself.
 */
export function usePublishValidation(props: Parameters<DocumentActionComponent>[0]): string | null {
  const targetId = props.draft?._id ?? props.published?._id ?? props.id;
  const { isValidating, validation } = useValidationStatus(targetId, props.type, true);
  if (isValidating) return "Checking the document…";
  if (validation.some((marker) => marker.level === "error")) {
    return "Fix the validation errors before publishing.";
  }
  return null;
}
