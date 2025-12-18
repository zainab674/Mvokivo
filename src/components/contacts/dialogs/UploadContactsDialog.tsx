import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactFileUpload } from "@/components/contacts/ContactFileUpload";
import { AlertTriangle, Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { bulkCreateContacts } from "@/lib/api/contacts/bulkCreateContacts";
import { parseContactCSV } from "@/utils/csvParser";
import { useToast } from "@/hooks/use-toast";

interface ContactList {
  id: string;
  name: string;
  count: number;
  createdAt: string;
}

interface UploadContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactLists: ContactList[];
  onSuccess?: () => void;
}

type UploadStep = 'select-list' | 'consent' | 'upload' | 'mapping';

export function UploadContactsDialog({
  open,
  onOpenChange,
  contactLists,
  onSuccess
}: UploadContactsDialogProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<UploadStep>('select-list');
  const [selectedListId, setSelectedListId] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleClose = () => {
    setCurrentStep('select-list');
    setSelectedListId("");
    setConsentGiven(false);
    setUploadedFile(null);
    onOpenChange(false);
  };

  const handleImport = async () => {
    if (!uploadedFile || !selectedListId) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          const contacts = parseContactCSV(csvText).map(c => ({
            ...c,
            list_id: selectedListId
          }));

          if (contacts.length === 0) {
            toast({
              title: "Error",
              description: "No valid contacts found in CSV. Ensure you have at least 'First Name' and either 'Phone' or 'Email' columns.",
              variant: "destructive"
            });
            setIsImporting(false);
            return;
          }

          const result = await bulkCreateContacts({
            contacts,
            listId: selectedListId
          });

          if (result.success) {
            toast({
              title: "Success",
              description: `Successfully imported ${result.count} contacts.`,
            });
            onSuccess?.();
            handleClose();
          } else {
            toast({
              title: "Import Failed",
              description: result.error || "An unknown error occurred during import.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error processing CSV:', error);
          toast({
            title: "Error",
            description: "Error processing CSV file.",
            variant: "destructive"
          });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(uploadedFile);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "Error",
        description: "Error reading file.",
        variant: "destructive"
      });
      setIsImporting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'select-list' && selectedListId) {
      setCurrentStep('consent');
    } else if (currentStep === 'consent' && consentGiven) {
      setCurrentStep('upload');
    } else if (currentStep === 'upload' && uploadedFile) {
      setCurrentStep('mapping');
    } else if (currentStep === 'mapping') {
      handleImport();
    }
  };

  const handleBack = () => {
    if (currentStep === 'consent') {
      setCurrentStep('select-list');
    } else if (currentStep === 'upload') {
      setCurrentStep('consent');
    } else if (currentStep === 'mapping') {
      setCurrentStep('upload');
    }
  };

  const selectedList = contactLists.find(list => list.id === selectedListId);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select-list':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="list-select" className="text-sm font-medium">
                Select Contact List
              </Label>
              <Select value={selectedListId} onValueChange={setSelectedListId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose which list to upload contacts to" />
                </SelectTrigger>
                <SelectContent>
                  {contactLists.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list.count} contacts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedList && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Contacts will be added to "{selectedList.name}" which currently has {selectedList.count} contacts.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'consent':
        return (
          <div className="space-y-6">
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Important:</strong> Please review and accept our data processing terms before uploading contacts.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Data Processing Agreement</h4>
                <p className="text-muted-foreground leading-relaxed">
                  By uploading contact information, you confirm that you have the necessary permissions
                  to share this data and that all contacts have provided appropriate consent for their
                  information to be used for business communications.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Privacy & Security</h4>
                <p className="text-muted-foreground leading-relaxed">
                  We implement industry-standard security measures to protect your contact data.
                  All information is encrypted in transit and at rest, and access is restricted to
                  authorized personnel only.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Data Usage</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Contact information will be used exclusively for the purposes you specify and in
                  accordance with applicable privacy laws including GDPR, CCPA, and CAN-SPAM regulations.
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent-checkbox"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked === true)}
                  className="mt-1"
                />
                <div>
                  <Label
                    htmlFor="consent-checkbox"
                    className="text-sm font-medium cursor-pointer leading-relaxed"
                  >
                    I acknowledge that I have read and agree to the data processing terms above.
                    I confirm that I have the necessary permissions to upload and use this contact data
                    for business communications.
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Upload Contact File</h3>
              <p className="text-muted-foreground text-sm">
                Upload a CSV or Excel file containing your contact information.
              </p>
            </div>

            <ContactFileUpload
              onFileSelect={(file) => setUploadedFile(file)}
              acceptedTypes=".csv,.xlsx,.xls"
              maxSize={10}
              selectedFile={uploadedFile}
            />


            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Supported formats:</strong> CSV, XLSX (XLSX not yet fully supported via web parser)</p>
              <p><strong>Required columns:</strong> First Name (or Name), Phone or Email</p>
              <p><strong>Optional columns:</strong> Last Name</p>
              <p><strong>Maximum file size:</strong> 10 MB</p>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Ready to Import</h3>
              <p className="text-muted-foreground text-sm">
                File "{uploadedFile?.name}" is ready for processing. We will automatically map common headers like Name, Phone, and Email.
              </p>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{uploadedFile?.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Target List: <span className="font-medium text-foreground">{selectedList?.name}</span>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Contacts without a name or without both email and phone will be skipped.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'select-list': return 'Upload Contacts - Select List';
      case 'consent': return 'Upload Contacts - Data Processing Agreement';
      case 'upload': return 'Upload Contacts - File Upload';
      case 'mapping': return 'Upload Contacts - Confirm Import';
      default: return 'Upload Contacts';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'select-list': return 'Choose which contact list to upload your contacts to.';
      case 'consent': return 'Please review and accept our data processing terms.';
      case 'upload': return 'Upload your contact file (CSV format).';
      case 'mapping': return 'Check your selection before starting the import.';
      default: return '';
    }
  };

  const canProceed = () => {
    if (isImporting) return false;
    switch (currentStep) {
      case 'select-list': return selectedListId !== "";
      case 'consent': return consentGiven;
      case 'upload': return uploadedFile !== null;
      case 'mapping': return true;
      default: return false;
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case 'select-list': return 'Continue';
      case 'consent': return 'I Agree - Continue';
      case 'upload': return 'Continue';
      case 'mapping': return isImporting ? 'Importing...' : 'Import Contacts';
      default: return 'Next';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isImporting && onOpenChange(val)}>
      <DialogContent className="sm:max-w-2xl backdrop-blur-xl bg-background/95 border-border/50">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-semibold">{getStepTitle()}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex gap-2">
          {!isImporting && (
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {currentStep !== 'select-list' && !isImporting && (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={currentStep === 'mapping' ? 'bg-green-600 hover:bg-green-700 min-w-[120px]' : 'min-w-[100px]'}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getNextButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
