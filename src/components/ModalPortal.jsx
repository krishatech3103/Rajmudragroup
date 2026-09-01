import { createPortal } from 'react-dom';

// Form dialogs must sit outside the app's scroll pane. Rendering at document
// level keeps a fixed overlay centered in the real device viewport on mobile.
export default function ModalPortal({ children }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
