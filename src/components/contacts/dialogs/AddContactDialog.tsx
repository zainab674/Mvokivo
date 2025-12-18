import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactList {
  id: string;
  name: string;
  count: number;
  createdAt: string;
}

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateContact: (contact: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    listId: string;
    status: 'active' | 'inactive' | 'do-not-call';
    doNotCall: boolean;
  }) => void;
  contactLists: ContactList[];
}

export function AddContactDialog({
  open,
  onOpenChange,
  onCreateContact,
  contactLists,
}: AddContactDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [listId, setListId] = useState("");
  const [doNotCall, setDoNotCall] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim() || !listId) return; // Email and last name can be optional technically but schema says email might be needed. Let's stick to what's required in the form.

    onCreateContact({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      listId,
      status: 'active',
      doNotCall,
    });

    // Reset form
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setListId("");
    setDoNotCall(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setListId("");
    setDoNotCall(false);
    onOpenChange(false);
  };

  const isFormValid = firstName.trim() && lastName.trim() && phone.trim() && email.trim() && listId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-background/95 border-border/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-semibold">Add New Contact</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new contact to your contact lists. All fields are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name" className="text-sm font-medium">
                  First Name *
                </Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name" className="text-sm font-medium">
                  Last Name *
                </Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (415) 555-1234"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.smith@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-list" className="text-sm font-medium">
                Contact List *
              </Label>
              <Select value={listId} onValueChange={setListId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact list" />
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

            <div className="flex items-center space-x-2 pt-2">
              <input
                id="do-not-call"
                type="checkbox"
                checked={doNotCall}
                onChange={(e) => setDoNotCall(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="do-not-call" className="text-sm font-medium">
                Do Not Call (DND)
              </Label>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Add Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}