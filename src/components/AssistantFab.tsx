import { IconChat } from './Icons';

interface AssistantFabProps {
  /** Whether the drawer is currently open (the fab steps aside when so). */
  open: boolean;
  onOpen: () => void;
}

/** Discreet, site-wide trigger for the Fafari Assistant. It hides while the
    drawer is open so it never floats above the sheet. */
export function AssistantFab({ open, onOpen }: AssistantFabProps) {
  return (
    <button
      type="button"
      className="assistant-fab"
      data-open={open}
      aria-label="Open the Fafari Assistant"
      aria-hidden={open}
      tabIndex={open ? -1 : 0}
      onClick={onOpen}
    >
      <IconChat className="assistant-fab-icon" />
      <span className="assistant-fab-label">Assistant</span>
    </button>
  );
}
