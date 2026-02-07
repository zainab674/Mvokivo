
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import { useAuth } from '@/contexts/SupportAccessAuthContext';
import { fetchAssistants } from '@/lib/api/assistants/fetchAssistants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Facebook, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URL } from '@/lib/api-config';
import axios from 'axios';

declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
    }
}

interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    category: string;
}

interface Integration {
    _id: string;
    page_id: string;
    page_name: string;
    assistant_id: string;
    connected_at: string;
}

export default function FacebookCampaigns() {
    const { user, getAccessToken } = useAuth();
    const { toast } = useToast();

    const [assistants, setAssistants] = useState<any[]>([]);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');
    const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);
    const [isConnectedToFb, setIsConnectedToFb] = useState(false);
    const [userAccessToken, setUserAccessToken] = useState<string | null>(null);

    // Load Assistants and Integrations
    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    // Load Facebook SDK
    useEffect(() => {
        // Only load if not already present
        if (document.getElementById('facebook-jssdk')) {
            setIsSdkLoaded(true);
            return;
        }

        window.fbAsyncInit = function () {
            window.FB.init({
                appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'MSG_SENDER_ID', // Replace with env var
                xfbml: true,
                version: 'v19.0'
            });
            setIsSdkLoaded(true);
        };

        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup? Usually not needed for SDK
        };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Fetch Assistants
            const { assistants: asstData } = await fetchAssistants(user!.id);
            setAssistants(asstData);

            // Fetch Integrations
            const token = await getAccessToken();
            const res = await axios.get(`${BACKEND_URL}/api/v1/facebook/integrations/${user!.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIntegrations(res.data.integrations);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookLogin = () => {
        if (!window.FB) return;

        window.FB.login((response: any) => {
            if (response.authResponse) {
                console.log('Logged in to Facebook', response);
                exchangeToken(response.authResponse.accessToken);
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, { scope: 'pages_manage_metadata,pages_read_engagement,leads_retrieval' });
    };

    const exchangeToken = async (shortLivedToken: string) => {
        try {
            setLoading(true);
            const token = await getAccessToken();
            const res = await axios.post(`${BACKEND_URL}/api/v1/facebook/exchange-token`, {
                shortLivedToken
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const longToken = res.data.accessToken;
                setUserAccessToken(longToken);
                setIsConnectedToFb(true);
                fetchPages(longToken);
                toast({ title: 'Connected to Facebook', description: 'Fetching your pages...' });
            }
        } catch (error) {
            console.error('Token exchange failed:', error);
            toast({ title: 'Connection Failed', description: 'Could not exchange token.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchPages = async (token: string) => {
        try {
            // Client-side fetch to Graph API
            const res = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
            setPages(res.data.data);
        } catch (error) {
            console.error('Failed to fetch pages:', error);
            toast({ title: 'Error', description: 'Could not fetch pages.', variant: 'destructive' });
        }
    };

    const handleSubscribe = async () => {
        if (!selectedPageId || !selectedAssistantId) {
            toast({ title: 'Validation Error', description: 'Please select a page and an assistant.', variant: 'destructive' });
            return;
        }

        const page = pages.find(p => p.id === selectedPageId);
        if (!page) return;

        try {
            setLoading(true);
            const token = await getAccessToken();
            await axios.post(`${BACKEND_URL}/api/v1/facebook/subscribe`, {
                userId: user!.id,
                pageId: page.id,
                pageName: page.name,
                pageAccessToken: page.access_token,
                assistantId: selectedAssistantId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast({ title: 'Success', description: `Connected ${page.name} to assistant!` });
            loadData(); // Refresh list
            // Reset selection
            setSelectedPageId('');
            setSelectedAssistantId('');
        } catch (error) {
            console.error('Subscription failed:', error);
            toast({ title: 'Failed', description: 'Could not subscribe page.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 rounded-lg">
                        <Facebook className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Facebook Lead Campaigns</h1>
                        <p className="text-zinc-400">Connect your Facebook Pages to auto-call new leads.</p>
                    </div>
                </div>

                {/* Configuration Card */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Connect New Page</CardTitle>
                        <CardDescription>Authorize Facebook and select a page to monitor.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!isConnectedToFb ? (
                            <Button
                                onClick={handleFacebookLogin}
                                disabled={!isSdkLoaded || loading}
                                className="bg-[#1877F2] hover:bg-[#1864D9] text-white w-full sm:w-auto"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Facebook className="mr-2 h-4 w-4" />}
                                Connect with Facebook
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2 text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Facebook Account Connected</span>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select Facebook Page</label>
                                        <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a page..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {pages.map(page => (
                                                    <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select Assistant to Call Lead</label>
                                        <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose an assistant..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {assistants.map(ast => (
                                                    <SelectItem key={ast.id} value={ast.id}>{ast.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSubscribe}
                                    disabled={loading || !selectedPageId || !selectedAssistantId}
                                    className="w-full sm:w-auto"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save & Activate
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Active Integrations */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {integrations.length === 0 ? (
                            <p className="text-zinc-500 text-center py-8">No active Facebook integrations found.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Page Name</TableHead>
                                        <TableHead>Page ID</TableHead>
                                        <TableHead>Assistant</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Connected At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {integrations.map(int => {
                                        const assistant = assistants.find(a => a.id === int.assistant_id);
                                        return (
                                            <TableRow key={int._id}>
                                                <TableCell className="font-medium">{int.page_name || 'Unknown Page'}</TableCell>
                                                <TableCell className="font-mono text-xs">{int.page_id}</TableCell>
                                                <TableCell>{assistant?.name || int.assistant_id}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Active</Badge>
                                                </TableCell>
                                                <TableCell className="text-zinc-400">
                                                    {new Date(int.connected_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
