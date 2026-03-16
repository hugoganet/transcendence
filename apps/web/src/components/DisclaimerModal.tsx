import { useState } from "react";
import { Button } from "./ui/Button.js";

interface DisclaimerModalProps {
  text: string;
  onAccept: () => void;
}

export function DisclaimerModal({ text, onAccept }: DisclaimerModalProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900 font-heading">
          Important Notice
        </h2>

        <div className="mb-4 max-h-60 overflow-y-auto rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
        </div>

        <label className="mb-4 flex items-start gap-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-600">
            I understand and wish to continue
          </span>
        </label>

        <Button onClick={onAccept} disabled={!accepted} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
