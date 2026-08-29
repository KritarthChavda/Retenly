'use client'

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/context/DashboardContext";

import { useToast } from '@/hooks/use-toast';

import { ChangePasswordModal } from '@/components/dashboard/ChangePasswordModal';


export default function Settings() {
  const { restaurant, setRestaurant } = useDashboard();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);


  useEffect(() => {
    if (restaurant) {
      setUsername(restaurant.username);
    }
  }, [restaurant]);

  const handleUpdateProfile = async () => {
    if (!restaurant) return;

    try {
      const response = await fetch('/api/restaurant/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
        toast({
          title: 'Success',
          description: 'Your profile has been updated.',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to update profile.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  if (!restaurant) {
    return null; // Or a loading/error state
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Manage your business profile and preferences
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Settings */}
          <Card className="bg-gradient-card border-glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-gradient">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your business information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                  <Input 
                    value={restaurant.name} 
                    className="mt-1 bg-background/50 border-glass"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <Input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 bg-background/50 border-glass"
                  />
                </div>
              </div>
              <Button className="bg-brand-gradient hover:opacity-90" onClick={handleUpdateProfile}>
                Update Profile
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gradient-card border-glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-positive">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure how you receive feedback notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-glass border border-glass">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive feedback alerts via email</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-background/50 border-glass">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-glass border border-glass">
                  <div>
                    <p className="font-medium">Real-time Alerts</p>
                    <p className="text-sm text-muted-foreground">Get instant notifications for new feedback</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-background/50 border-glass">
                    Enable
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-gradient-card border-glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-negative">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-glass border border-glass">
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-muted-foreground">Update your login credentials</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-background/50 border-glass" onClick={() => setChangePasswordModalOpen(true)}>
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-glass border border-glass">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-background/50 border-glass">
                    Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="bg-gradient-card border-glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-neutral">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize your dashboard appearance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-glass border border-glass">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme for better visibility</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-background/50 border-glass">
                    Enabled
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-glass border border-glass">
                  <div>
                    <p className="font-medium">Compact View</p>
                    <p className="text-sm text-muted-foreground">Show more data in less space</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-background/50 border-glass">
                    Disable
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      {isChangePasswordModalOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />
      )}
      </div>
  );
}
