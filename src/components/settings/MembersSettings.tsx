import { useState, useEffect } from 'react';
import { Search, Users, Mail, MoreHorizontal, Shield, Crown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface WorkspaceMember {
  id: string;
  email: string;
  role: string;
  status: string;
  joined_at?: string;
  invited_at?: string;
  user_name?: string;
}

interface WorkspaceInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export function MembersSettings() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMembersAndInvitations();
  }, []);

  const fetchMembersAndInvitations = async () => {
    try {
      // In a real app we might wait for auth, but here we assume token is available or we check/redirect
      const token = localStorage.getItem('token');
      if (!token) return;

      // 1. Fetch members
      const membersRes = await fetch('/api/v1/workspace/members', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const membersData = await membersRes.json();
      if (!membersRes.ok) throw new Error(membersData.error || 'Failed to fetch members');

      // 2. Fetch invitations
      const invitationsRes = await fetch('/api/v1/workspace/invitations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const invitationsData = await invitationsRes.json();
      if (!invitationsRes.ok) throw new Error(invitationsData.error || 'Failed to fetch invitations');

      setMembers(membersData || []);
      setInvitations(invitationsData || []);
    } catch (error) {
      console.error('Error fetching members and invitations:', error);
      toast.error('Failed to load workspace members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteRole) return;

    setIsInviting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Not authenticated");

      const response = await fetch('/api/v1/workspace/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to send invitation');

      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("member");
      fetchMembersAndInvitations();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/v1/workspace/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to remove member');

      toast.success('Member removed from workspace');
      fetchMembersAndInvitations();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/v1/workspace/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to cancel invitation');

      toast.success('Invitation cancelled');
      fetchMembersAndInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-green-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Filter members and invitations based on search and role
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || invitation.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalCount = filteredMembers.length + filteredInvitations.length;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extralight tracking-tight text-foreground">Members</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extralight tracking-tight text-foreground">Members</h2>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          Manage all members in your workspace
        </p>
      </div>

      {/* Header with search, filter, and invite */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowInviteDialog(true)} className="shrink-0">
          Invite your team
        </Button>
      </div>

      {/* Member count */}
      <p className="text-sm text-muted-foreground">
        {totalCount} team member{totalCount !== 1 ? 's' : ''}
      </p>

      {/* Members list */}
      <div className="space-y-4">
        {/* Active members */}
        {filteredMembers.map((member) => (
          <div key={member.id} className="settings-card !py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(member.email)}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{member.user_name || member.email.split('@')[0]}</p>
                  <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </div>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>

            {member.role !== 'owner' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRemoveMember(member.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove from workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}

        {/* Pending invitations */}
        {filteredInvitations.map((invitation) => (
          <div key={invitation.id} className="settings-card !py-4 flex items-center justify-between opacity-75">
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{invitation.email.split('@')[0]}</p>
                  <Badge variant="outline" className="text-xs">
                    <div className="flex items-center gap-1">
                      {getRoleIcon(invitation.role)}
                      {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                    </div>
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Invited
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{invitation.email}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCancelInvitation(invitation.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel invitation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No members found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || roleFilter !== 'all'
                ? "Try adjusting your search or filter criteria."
                : "Start building your team by inviting members to your workspace."
              }
            </p>
            {(!searchQuery && roleFilter === 'all') && (
              <Button onClick={() => setShowInviteDialog(true)}>
                Invite your first team member
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your workspace. They'll receive an email with instructions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteEmail || isInviting}
            >
              {isInviting ? "Sending..." : "Send invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}