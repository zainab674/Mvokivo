import React from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { Camera, Mail, Building, Calendar } from "lucide-react";


export default function Profile() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your account settings and personal information</p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                Profile Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Update your personal details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    defaultValue={user?.fullName || ""}
                    className="bg-background/50 h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ""}
                    className="bg-background/50 h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company
                  </Label>
                  <Input
                    id="company"
                    defaultValue={user?.company || ""}
                    className="bg-background/50 h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="memberSince" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </Label>
                  <Input
                    id="memberSince"
                    defaultValue={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                    className="bg-background/50 h-10"
                    disabled
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button className="w-full sm:w-auto">Save Changes</Button>
                <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
