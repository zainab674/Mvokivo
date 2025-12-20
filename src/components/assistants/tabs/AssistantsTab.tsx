import React, { useEffect, useMemo, useState } from "react";
import { Search, Edit2, Plus, Trash2, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateAssistantDialog } from "@/components/assistants/CreateAssistantDialog";
import { AssistantDetailsDialog } from "@/components/assistants/AssistantDetailsDialog";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ThemedDialog,
  ThemedDialogTrigger,
  ThemedDialogContent,
  ThemedDialogHeader,
} from "@/components/ui/themed-dialog";
import { fetchAssistants } from "@/lib/api/assistants/fetchAssistants";
import { BACKEND_URL } from "@/lib/api-config";

interface Assistant {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  first_message?: string;
  first_sms?: string;
  sms_prompt?: string;
  status: "draft" | "active" | "inactive";
  interactionCount: number;
  userCount: number;
  cal_api_key?: string;
  cal_event_type_slug?: string;
  cal_event_type_id?: string;
  cal_timezone?: string;
  cal_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

function AssistantTableRow({
  assistant,
  onDelete,
  onCardClick
}: {
  assistant: Assistant;
  onDelete: (id: string) => void;
  onCardClick: (assistant: Assistant) => void;
}) {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const statusConfig = {
    draft: {
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      dot: 'bg-yellow-500'
    },
    active: {
      color: 'bg-green-600/20 text-green-300 border-green-500/30',
      dot: 'bg-green-500'
    },
    inactive: {
      color: 'bg-zinc-700/50 text-zinc-300 border-zinc-600/50',
      dot: 'bg-zinc-500'
    }
  };

  const config = statusConfig[assistant.status] || statusConfig.active;

  const handleEdit = () => {
    navigate(`/assistants/edit/${assistant.id}`);
  };

  const handleView = () => {
    onCardClick(assistant);
  };

  // Extract core identity from description (remove markdown headers)
  const getDescriptionPreview = () => {
    let desc = assistant.description || '';
    // Remove markdown headers like "## Core Identity"
    desc = desc.replace(/^##\s+Core Identity\s*/i, '');
    desc = desc.replace(/^##\s+/gm, '');
    // Clean up and truncate
    desc = desc.trim();
    if (desc.length > 150) {
      return desc.substring(0, 150) + '...';
    }
    return desc || 'No description available';
  };

  return (
    <TableRow className="border-b border-white/5 hover:bg-zinc-800/50 transition-colors">
      <TableCell className="font-medium">
        <button
          onClick={handleView}
          className="text-white hover:text-indigo-400 transition-colors text-left"
        >
          {assistant.name}
        </button>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-xs px-2 py-1 border ${config.color}`}>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {assistant.status.charAt(0).toUpperCase() + assistant.status.slice(1)}
          </div>
        </Badge>
      </TableCell>
      <TableCell className="text-zinc-400 text-sm max-w-md">
        <div className="line-clamp-2">
          {getDescriptionPreview()}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700/50">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800/95 border-zinc-700/50 backdrop-blur-sm">
            <DropdownMenuItem
              onClick={handleView}
              className="text-white hover:bg-zinc-700/50"
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleEdit}
              className="text-white hover:bg-zinc-700/50"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className="text-red-400 hover:bg-red-600/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Delete Confirmation Dialog */}
      <ThemedDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ThemedDialogContent>
          <ThemedDialogHeader
            title="Delete Assistant"
            description={`Are you sure you want to delete "${assistant.name}"? This action cannot be undone and will permanently remove the assistant and all its data.`}
          />
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onDelete(assistant.id);
                setIsDeleteOpen(false);
              }}
            >
              Delete Assistant
            </Button>
          </div>
        </ThemedDialogContent>
      </ThemedDialog>
    </TableRow>
  );
}

interface AssistantsTabProps {
  tabChangeTrigger?: number;
}

export function AssistantsTab({ tabChangeTrigger = 0 }: AssistantsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadAssistantsForUser = async () => {
    if (!user?.id) {
      setAssistants([]);
      return;
    }

    console.log("Loading assistants for user:", user.id);

    try {
      const { assistants: data } = await fetchAssistants(user.id);
      console.log("Number of assistants loaded:", data.length);

      // Cast to local Assistant type as API returns full object
      setAssistants(data as unknown as Assistant[]);
    } catch (error) {
      console.warn("Failed to load assistants:", error);
      setAssistants([]);
    }
  };

  const deleteAssistant = async (assistantId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to delete assistants.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/assistants/${assistantId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete assistant');
      }

      // Remove the assistant from the local state
      setAssistants(prev => prev.filter(assistant => assistant.id !== assistantId));

      // Close the detail modal if the deleted assistant is currently being viewed
      if (selectedAssistant?.id === assistantId) {
        setIsDialogOpen(false);
        setSelectedAssistant(null);
      }

      toast({
        title: "Assistant deleted",
        description: "The assistant has been permanently deleted.",
      });
    } catch (error) {
      console.error("Error deleting assistant:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load assistants when user exists or tab changes
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      loadAssistantsForUser().finally(() => setLoading(false));
    }
  }, [user, tabChangeTrigger]);

  const handleAssistantClick = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedAssistant(null);
  };

  const filteredAssistants = useMemo(
    () =>
      assistants.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [assistants, searchQuery]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            Your Agents
          </h2>
          <p className="text-sm text-zinc-400">
            Manage and configure your AI agents for different use cases
          </p>
        </div>
        <Button
          variant="default"
          className="font-medium gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={(e) => {
            console.log("Add Assistant button clicked", e);
            setCreateDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Assistant
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search assistants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-indigo-500/50"
        />
      </div>

      {/* Assistants Table */}
      <div className="bg-zinc-800/30 rounded-lg border border-zinc-700/50 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-zinc-800/50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : filteredAssistants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="text-white font-semibold text-sm">Name</TableHead>
                <TableHead className="text-white font-semibold text-sm">Status</TableHead>
                <TableHead className="text-white font-semibold text-sm">Core Identity</TableHead>
                <TableHead className="text-right text-white font-semibold text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssistants.map((assistant) => (
                <AssistantTableRow
                  key={assistant.id}
                  assistant={assistant}
                  onDelete={deleteAssistant}
                  onCardClick={handleAssistantClick}
                />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-zinc-700/50">
              <Search className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No assistants found
            </h3>
            <p className="text-zinc-400 mb-4">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Get started by creating your first AI assistant"
              }
            </p>
            {!searchQuery && (
              <Button
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Assistant
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Assistant Dialog */}
      {createDialogOpen && (
        <CreateAssistantDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreateAssistant={(name: string, description: string) => {
            // Reload assistants after creation
            loadAssistantsForUser();
          }}
        />
      )}

      {/* Assistant Details Dialog */}
      <AssistantDetailsDialog
        assistant={selectedAssistant}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
      />
    </div>
  );
}
