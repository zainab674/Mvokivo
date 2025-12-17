import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface TermsOfUseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccepted: () => void;
}

export function TermsOfUseDialog({ open, onOpenChange, onAccepted }: TermsOfUseDialogProps) {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      onAccepted();
      setAgreed(false); // Reset for next time
    }
  };

  const handleClose = () => {
    setAgreed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Terms of Use
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Please read and accept the terms before creating your campaign
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Legal Compliance is Your Duty</h3>
              <p className="text-muted-foreground">
                You are solely responsible for ensuring your use of the services complies with all applicable laws,
                including telemarketing regulations (like TCPA, Do-Not-Call), rules about prerecorded messages,
                obtaining necessary recipient consent, accurate Caller ID information, required disclosures, and call recording laws.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Consent is Required</h3>
              <p className="text-muted-foreground">
                You must obtain and maintain proof of the necessary consent, existing business relationship,
                or valid legal exemption before making communications where required by law.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Service Provided "AS IS"</h3>
              <p className="text-muted-foreground">
                The services and website content are provided without any warranties or guarantees of accuracy,
                completeness, reliability, or fitness for a particular purpose. Use is entirely at your own risk.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Limited Liability</h3>
              <p className="text-muted-foreground">
                Wave Runner Media will not be liable for lost profits or various indirect, special, incidental,
                or consequential damages arising from your use of the service.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Indemnification</h3>
              <p className="text-muted-foreground">
                You agree to cover any costs, losses, or damages incurred by the service provider resulting from
                your breach of these terms, negligence, or misuse of the services (including legal fees).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Data Usage License</h3>
              <p className="text-muted-foreground">
                You grant Wave Runner Media a license to use the data you provide to operate, maintain, and improve the services.
                The provider owns aggregated usage and statistical data.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Confidentiality</h3>
              <p className="text-muted-foreground">
                Both parties agree to protect confidential information shared between them according to the terms outlined.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agree-terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
              />
              <label
                htmlFor="agree-terms"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                I have read and agree to the Terms of Use
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={!agreed}
                className="px-6"
              >
                Next
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}