import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, Upload, Phone, Mail, MoreHorizontal, Users, FileText, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddListDialog } from "@/components/contacts/dialogs/AddListDialog";
import { AddContactDialog } from "@/components/contacts/dialogs/AddContactDialog";
import { UploadContactsDialog } from "@/components/contacts/dialogs/UploadContactsDialog";
import { formatPhoneNumber } from "@/utils/formatUtils";
import DashboardLayout from "@/layout/DashboardLayout";
import { ThemeContainer } from "@/components/theme/ThemeContainer";
import { ThemeSection } from "@/components/theme/ThemeSection";
import { ThemeCard } from "@/components/theme/ThemeCard";
import { saveCsvFile, SaveCsvFileRequest } from "@/lib/api/csv/saveCsvFile";
import { saveCsvContacts, SaveCsvContactsRequest } from "@/lib/api/csv/saveCsvContacts";
import { fetchCsvFiles, CsvFile as DbCsvFile } from "@/lib/api/csv/fetchCsvFiles";
import { fetchCsvContacts, CsvContact as DbCsvContact } from "@/lib/api/csv/fetchCsvContacts";
import { deleteCsvFile as deleteCsvFileAPI } from "@/lib/api/csv/deleteCsvFile";
import { DeleteCsvFileDialog } from "@/components/contacts/dialogs/DeleteCsvFileDialog";
import { EditContactDialog } from "@/components/contacts/dialogs/EditContactDialog";
import { DeleteContactDialog } from "@/components/contacts/dialogs/DeleteContactDialog";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { fetchContacts } from "@/lib/api/contacts/fetchContacts";
import { fetchContactLists } from "@/lib/api/contacts/fetchContactLists";
import { useToast } from "@/hooks/use-toast";

// Mock data structures
interface ContactList {
  id: string;
  name: string;
  count: number;
  createdAt: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  listId: string;
  listName: string;
  status: 'active' | 'inactive' | 'do-not-call';
  created: string;
  doNotCall: boolean;
}

interface CSVFile {
  id: string;
  name: string;
  uploadedAt: string;
  rowCount: number;
  data: CSVContact[];
}



import { parseContactCSV, ParsedContact as CSVContact } from "@/utils/csvParser";

export default function Contacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedList, setSelectedList] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addListOpen, setAddListOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [uploadContactsOpen, setUploadContactsOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // CSV upload states
  const [csvFiles, setCsvFiles] = useState<CSVFile[]>([]);
  const [selectedCsvFile, setSelectedCsvFile] = useState<string | null>(null);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV delete states
  const [deleteCsvOpen, setDeleteCsvOpen] = useState(false);
  const [csvToDelete, setCsvToDelete] = useState<{ id: string; name: string; contactCount: number; campaigns?: Array<{ id: string; name: string }> } | null>(null);
  const [deletingCsv, setDeletingCsv] = useState(false);

  // Load real data from database
  const loadContacts = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Load contact lists
      const listsResponse = await fetchContactLists();
      const transformedLists: ContactList[] = listsResponse.contactLists.map(list => ({
        id: list.id,
        name: list.name,
        count: list.count,
        createdAt: list.created_at.split('T')[0]
      }));
      setContactLists(transformedLists);

      // Load contacts
      const contactsResponse = await fetchContacts();
      const transformedContacts: Contact[] = contactsResponse.contacts.map(contact => ({
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        listId: contact.list_id,
        listName: contact.list_name,
        status: contact.status,
        created: contact.created_at.split('T')[0],
        doNotCall: !!contact.do_not_call
      }));
      setContacts(transformedContacts);

    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadContacts();
  }, [user?.id]);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchQuery === "" ||
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);

    const matchesList = selectedList === "all" || contact.listId === selectedList;

    return matchesSearch && matchesList;
  });

  const handleCreateList = async (name: string) => {
    // Refresh data after creating list
    await loadContacts();
  };

  const handleCreateContact = async (contactData: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    listId: string;
    status: 'active' | 'inactive' | 'do-not-call';
    doNotCall: boolean;
  }) => {
    // Refresh data after creating contact
    await loadContacts();
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEditContactOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    setSelectedContact(contact);
    setDeleteContactOpen(true);
  };

  const handleContactUpdated = async () => {
    await loadContacts();
  };

  const handleContactDeleted = async () => {
    await loadContacts();
  };

  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.status === 'active').length;

  // CSV handling functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload CSV files",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          const csvData = parseContactCSV(csvText);

          if (csvData.length === 0) {
            toast({
              title: "No data",
              description: "No valid contact data found in CSV file. Check if headers are correct.",
              variant: "destructive"
            });
            setIsUploading(false);
            return;
          }

          // Save CSV file metadata to database
          const csvFileData: SaveCsvFileRequest = {
            name: file.name,
            rowCount: csvData.length,
            fileSize: file.size,
            userId: user.id
          };

          const csvFileResult = await saveCsvFile(csvFileData);

          if (!csvFileResult.success || !csvFileResult.csvFileId) {
            toast({
              title: "Upload Failed",
              description: 'Failed to save CSV file: ' + csvFileResult.error,
              variant: "destructive"
            });
            setIsUploading(false);
            return;
          }

          // Save CSV contacts to database
          const csvContactsData: SaveCsvContactsRequest = {
            csvFileId: csvFileResult.csvFileId,
            contacts: csvData,
            userId: user.id
          };

          const csvContactsResult = await saveCsvContacts(csvContactsData);

          if (!csvContactsResult.success) {
            toast({
              title: "Upload Failed",
              description: 'Failed to save CSV contacts: ' + csvContactsResult.error,
              variant: "destructive"
            });
            setIsUploading(false);
            return;
          }

          // Update local state
          const newCsvFile: CSVFile = {
            id: csvFileResult.csvFileId,
            name: file.name,
            uploadedAt: new Date().toISOString().split('T')[0],
            rowCount: csvData.length,
            data: csvData
          };

          setCsvFiles(prev => [...prev, newCsvFile]);
          setSelectedCsvFile(newCsvFile.id);
          setShowCsvPreview(true);

          alert(`Successfully uploaded ${csvContactsResult.savedCount} contacts from ${file.name}`);
          toast({
            title: "Success",
            description: `Successfully uploaded ${csvContactsResult.savedCount} contacts from ${file.name}`,
          });
        } catch (error) {
          console.error('Error processing CSV file:', error);
          toast({
            title: "Error",
            description: 'Error processing CSV file: ' + (error instanceof Error ? error.message : 'Unknown error'),
            variant: "destructive"
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "Error",
        description: 'Error reading file: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  const handleCsvFileSelect = async (csvId: string) => {
    setSelectedCsvFile(csvId);
    setShowCsvPreview(true);

    // Load CSV contacts from database if not already loaded
    const csvFile = csvFiles.find(file => file.id === csvId);

    if (csvFile && csvFile.data.length === 0) {
      try {
        const response = await fetchCsvContacts(csvId);
        const csvContactsData: CSVContact[] = response.contacts.map(contact => ({
          first_name: contact.first_name,
          last_name: contact.last_name || '',
          phone: contact.phone || '',
          email: contact.email || '',
          status: contact.status,
          do_not_call: contact.do_not_call
        }));

        // Update the CSV file with loaded data
        setCsvFiles(prev => prev.map(file =>
          file.id === csvId
            ? { ...file, data: csvContactsData }
            : file
        ));
      } catch (error) {
        console.error('Error loading CSV contacts:', error);
        toast({
          title: "Error",
          description: 'Error loading CSV contacts: ' + (error instanceof Error ? error.message : 'Unknown error'),
          variant: "destructive"
        });
      }
    }
  };

  const handleRemoveCsvFile = (csvId: string) => {
    const file = csvFiles.find(f => f.id === csvId);
    if (file) {
      setCsvToDelete({
        id: file.id,
        name: file.name,
        contactCount: file.rowCount
      });
      setDeleteCsvOpen(true);
    }
  };

  const confirmDeleteCsvFile = async () => {
    if (!csvToDelete) return;

    setDeletingCsv(true);
    try {
      const result = await deleteCsvFileAPI({ csvFileId: csvToDelete.id });

      if (result.success) {
        // Remove from local state
        setCsvFiles(prev => prev.filter(file => file.id !== csvToDelete.id));
        if (selectedCsvFile === csvToDelete.id) {
          setSelectedCsvFile(null);
          setShowCsvPreview(false);
        }
        setDeleteCsvOpen(false);
        setCsvToDelete(null);
      } else {
        console.error('Error deleting CSV file:', result.error);
        // Update the CSV to delete with campaigns data if provided
        if (result.campaigns) {
          setCsvToDelete(prev => prev ? { ...prev, campaigns: result.campaigns } : null);
        } else {
          toast({
            title: "Delete Failed",
            description: 'Error deleting CSV file: ' + result.error,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error deleting CSV file:', error);
      toast({
        title: "Error",
        description: 'Error deleting CSV file: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      });
    } finally {
      setDeletingCsv(false);
    }
  };

  const selectedCsvData = csvFiles.find(file => file.id === selectedCsvFile);

  // Load CSV files from database on component mount
  useEffect(() => {
    const loadCsvFiles = async () => {
      if (!user?.id) return;

      try {
        const response = await fetchCsvFiles();
        const csvFilesData: CSVFile[] = response.csvFiles.map(file => ({
          id: file.id,
          name: file.name,
          uploadedAt: file.uploaded_at.split('T')[0],
          rowCount: file.row_count,
          data: [] // We'll load this when needed
        }));
        setCsvFiles(csvFilesData);
      } catch (error) {
        console.error('Error loading CSV files:', error);
      }
    };

    loadCsvFiles();
  }, [user?.id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-foreground">Loading contacts...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
                  Contacts
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {totalContacts} {totalContacts === 1 ? 'contact' : 'contacts'} • {activeContacts} active
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                  {isUploading ? '...' : (
                    <>
                      <span className="hidden sm:inline">Upload CSV</span>
                      <span className="sm:hidden">CSV</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUploadContactsOpen(true)}
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Upload List</span>
                  <span className="sm:hidden">List</span>
                </Button>
                <Button
                  onClick={() => setAddContactOpen(true)}
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Add Contact</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left Sidebar - Contact Lists & CSV Files (Mobile Horizontal Scroll) */}
          <div className="lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card/50 backdrop-blur-sm overflow-x-auto lg:overflow-y-auto no-scrollbar">
            <div className="flex lg:flex-col p-2 lg:p-6 gap-6">
              {/* Contact Lists Section */}
              <div className="flex lg:flex-col flex-shrink-0 sm:min-w-[200px] lg:min-w-0">
                <div className="hidden lg:flex items-center justify-between mb-4">
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contact Lists</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddListOpen(true)}
                    className="h-7 w-7 p-0 hover:bg-accent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex lg:flex-col gap-2">
                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all whitespace-nowrap lg:whitespace-normal ${selectedList === "all" && !showCsvPreview
                      ? "bg-primary/10 border border-primary/20 text-primary"
                      : "hover:bg-accent hover:text-accent-foreground border border-transparent text-muted-foreground"
                      }`}
                    onClick={() => {
                      setSelectedList("all");
                      setShowCsvPreview(false);
                    }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Users className="h-4 w-4" />
                      <span className="font-medium text-xs sm:text-sm">All Contacts</span>
                    </div>
                    <Badge variant="secondary" className="hidden lg:flex text-xs">
                      {totalContacts}
                    </Badge>
                  </div>

                  {contactLists.map(list => (
                    <div
                      key={list.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all whitespace-nowrap lg:whitespace-normal ${selectedList === list.id && !showCsvPreview
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "hover:bg-accent hover:text-accent-foreground border border-transparent text-muted-foreground"
                        }`}
                      onClick={() => {
                        setSelectedList(list.id);
                        setShowCsvPreview(false);
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedList === list.id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        <span className="font-medium text-xs sm:text-sm">{list.name}</span>
                      </div>
                      <Badge variant="secondary" className="hidden lg:flex text-xs">
                        {list.count}
                      </Badge>
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden h-8 px-2 text-muted-foreground"
                    onClick={() => setAddListOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* CSV Files Section */}
              <div className="flex lg:flex-col flex-shrink-0 sm:min-w-[200px] lg:min-w-0 border-l lg:border-l-0 lg:border-t border-border/50 pl-4 lg:pl-0 lg:pt-6">
                <div className="hidden lg:flex items-center justify-between mb-4">
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CSV Files</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 w-7 p-0 hover:bg-accent"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex lg:flex-col gap-2">
                  {csvFiles.map(file => (
                    <div
                      key={file.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all group cursor-pointer whitespace-nowrap lg:whitespace-normal ${selectedCsvFile === file.id && showCsvPreview
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "hover:bg-accent hover:text-accent-foreground border border-transparent text-muted-foreground"
                        }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCsvFileSelect(file.id);
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1 lg:block hidden">
                          <div className="font-medium text-xs sm:text-sm truncate">
                            {file.name}
                          </div>
                          <div className="text-[10px] opacity-70">
                            {file.rowCount} rows
                          </div>
                        </div>
                        <span className="lg:hidden text-xs sm:text-sm font-medium">{file.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hidden lg:flex opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCsvFile(file.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden h-8 px-2 text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-background/50 overflow-hidden">
            {/* Search Bar */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border bg-background/95 backdrop-blur-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={showCsvPreview ? "Search CSV contacts..." : "Search contacts..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Table Area */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              {showCsvPreview && selectedCsvData ? (
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        CSV Preview: {selectedCsvData.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCsvData.rowCount} contacts • {selectedCsvData.uploadedAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveCsvFile(selectedCsvData.id)}
                        className="sm:hidden flex-1 h-9"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Delete CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCsvPreview(false);
                          setSelectedCsvFile(null);
                        }}
                        className="h-9 flex-1 sm:flex-none"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Regular Contacts
                      </Button>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border/60 hover:bg-transparent">
                            <TableHead className="min-w-[150px] text-foreground font-semibold text-xs sm:text-sm">Name</TableHead>
                            <TableHead className="min-w-[200px] text-foreground font-semibold text-xs sm:text-sm">Email</TableHead>
                            <TableHead className="min-w-[140px] text-foreground font-semibold text-xs sm:text-sm">Phone Number</TableHead>
                            <TableHead className="min-w-[100px] text-foreground font-semibold text-xs sm:text-sm text-center">Status</TableHead>
                            <TableHead className="min-w-[80px] text-foreground font-semibold text-xs sm:text-sm text-center">DND</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCsvData.data
                            .filter(contact => {
                              if (!searchQuery) return true;
                              return (
                                contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                contact.phone.includes(searchQuery)
                              );
                            })
                            .map((contact, index) => (
                              <TableRow key={index} className="border-b border-border/40 hover:bg-accent/30 transition-colors">
                                <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                                  {contact.first_name} {contact.last_name}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs sm:text-sm">
                                  {contact.email || '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs sm:text-sm">
                                  {contact.phone ? formatPhoneNumber(contact.phone) : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${contact.status === 'active'
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                      : 'bg-muted text-muted-foreground border-border'
                                      }`}
                                  >
                                    {contact.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {contact.do_not_call ? (
                                    <Badge variant="destructive" className="text-[10px]">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">No</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-6">
                  <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border/60 hover:bg-transparent">
                            <TableHead className="min-w-[150px] text-foreground font-semibold text-xs sm:text-sm">Name</TableHead>
                            <TableHead className="min-w-[200px] text-foreground font-semibold text-xs sm:text-sm">Email</TableHead>
                            <TableHead className="min-w-[140px] text-foreground font-semibold text-xs sm:text-sm">Phone Number</TableHead>
                            <TableHead className="min-w-[100px] text-foreground font-semibold text-xs sm:text-sm">List</TableHead>
                            <TableHead className="min-w-[80px] text-foreground font-semibold text-xs sm:text-sm text-center">DND</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContacts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12">
                                <div className="text-muted-foreground">
                                  <div className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center border border-border">
                                    <Users className="w-6 sm:w-8 h-6 sm:h-8 text-muted-foreground" />
                                  </div>
                                  <p className="text-foreground font-medium mb-1 text-sm sm:text-base">
                                    {searchQuery ? "No contacts found" : "No contacts yet"}
                                  </p>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {searchQuery ? "Try adjusting your search." : "Add your first contact to get started."}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredContacts.map(contact => (
                              <TableRow key={contact.id} className="border-b border-border/40 hover:bg-accent/30 transition-colors">
                                <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                                  {contact.firstName} {contact.lastName}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs sm:text-sm">
                                  {contact.email}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs sm:text-sm">
                                  {formatPhoneNumber(contact.phone)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs sm:text-sm">
                                  {contact.listName}
                                </TableCell>
                                <TableCell className="text-center">
                                  {contact.doNotCall ? (
                                    <Badge variant="destructive" className="text-[10px]">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">No</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                      <DropdownMenuItem
                                        onClick={() => handleEditContact(contact)}
                                        className="text-xs"
                                      >
                                        Edit Contact
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-400 text-xs"
                                        onClick={() => handleDeleteContact(contact)}
                                      >
                                        Delete Contact
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddListDialog
        open={addListOpen}
        onOpenChange={setAddListOpen}
        onCreateList={handleCreateList}
      />

      <AddContactDialog
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        onCreateContact={handleCreateContact}
        contactLists={contactLists}
      />

      <UploadContactsDialog
        open={uploadContactsOpen}
        onOpenChange={setUploadContactsOpen}
        contactLists={contactLists}
        onSuccess={loadContacts}
      />

      <DeleteCsvFileDialog
        open={deleteCsvOpen}
        onOpenChange={setDeleteCsvOpen}
        onConfirm={confirmDeleteCsvFile}
        csvFileName={csvToDelete?.name || ''}
        contactCount={csvToDelete?.contactCount || 0}
        campaigns={csvToDelete?.campaigns || []}
        loading={deletingCsv}
      />

      <EditContactDialog
        open={editContactOpen}
        onOpenChange={setEditContactOpen}
        contact={selectedContact}
        contactLists={contactLists}
        onContactUpdated={handleContactUpdated}
      />

      <DeleteContactDialog
        open={deleteContactOpen}
        onOpenChange={setDeleteContactOpen}
        contact={selectedContact}
        onContactDeleted={handleContactDeleted}
      />
    </DashboardLayout>
  );
}