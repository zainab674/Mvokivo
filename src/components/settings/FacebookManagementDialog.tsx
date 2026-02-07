
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Facebook, Trash2, ExternalLink, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/contexts/SupportAccessAuthContext";
import axios from "axios";

// Import global FB type if needed
declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
        FB_INITIALIZED?: boolean;
    }
}

interface FacebookManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ConnectedPage {
    page_id: string;
    page_name: string;
    connected_at: string;
    assistant_id: string;
}

export function FacebookManagementDialog({ open, onOpenChange }: FacebookManagementDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [connectedPages, setConnectedPages] = useState<ConnectedPage[]>([]);
    const [isSdkReady, setIsSdkReady] = useState(false);
    const [isHttps, setIsHttps] = useState(true);

    // Config State
    const [appId, setAppId] = useState<string | null>(null);
    const [inputAppId, setInputAppId] = useState("");
    const [inputAppSecret, setInputAppSecret] = useState("");
    const [showConfig, setShowConfig] = useState(false);
    const [webhookConfig, setWebhookConfig] = useState({ callbackUrl: '', verifyToken: '' });

    useEffect(() => {
        // Check for secure context (HTTPS or localhost)
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isSecure = window.location.protocol === 'https:';
        if (!isSecure && !isLocalhost) {
            setIsHttps(false);
            if (open) {
                toast({
                    title: "Insecure Context detected",
                    description: "Facebook Login requires HTTPS. Please enable HTTPS or use localhost.",
                    variant: "destructive"
                });
            }
        }
    }, [open]);

    // Fetch Config and Integrations
    useEffect(() => {
        if (user && open) {
            fetchAppConfig();
            fetchIntegrations(user.id);
            fetchWebhookConfig();
        }
    }, [open, user]);

    const fetchWebhookConfig = async () => {
        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const res = await axios.get(`${BACKEND_URL}/api/v1/facebook/config`);
            if (res.data.success) {
                setWebhookConfig(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch webhook config", e);
        }
    };

    const fetchAppConfig = async () => {
        if (!user) return;
        try {
            const token = localStorage.getItem('auth_token');
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const res = await axios.get(`${BACKEND_URL}/api/v1/facebook/credentials/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.appId) {
                setAppId(res.data.appId);
                setInputAppId(res.data.appId);
                setShowConfig(false);
                initFacebookSdk(res.data.appId);
            } else {
                setAppId(null);
                setShowConfig(true);
            }
        } catch (e: any) {
            // If 404 or just error, show config
            setShowConfig(true);
        }
    };

    const fetchIntegrations = async (userId: string) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const res = await axios.get(`${BACKEND_URL}/api/v1/facebook/integrations/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setConnectedPages(res.data.integrations);
            }
        } catch (error) {
            console.error("Failed to fetch Facebook integrations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!user || !inputAppId || !inputAppSecret) {
            toast({ title: "Missing Fields", description: "Please enter both App ID and App Secret", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

            await axios.post(`${BACKEND_URL}/api/v1/facebook/credentials`,
                { userId: user.id, appId: inputAppId, appSecret: inputAppSecret },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAppId(inputAppId);
            setShowConfig(false);
            toast({ title: "Configuration Saved", description: "Facebook App credentials saved." });

            // Re-init SDK
            initFacebookSdk(inputAppId);

        } catch (e) {
            console.error(e);
            toast({ title: "Save Failed", description: "Could not save credentials.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const initFacebookSdk = (dynamicAppId: string) => {
        if (!dynamicAppId) return;

        // Prepare the init params
        const initParams = {
            appId: dynamicAppId,
            cookie: true,
            xfbml: true,
            version: 'v19.0'
        };

        const onSdkLoaded = () => {
            try {
                window.FB.init(initParams);
                window.FB_INITIALIZED = true;
                setIsSdkReady(true);
                console.log("Facebook SDK Initialized with App ID:", dynamicAppId);
            } catch (e) {
                console.error("FB Init Error:", e);
            }
        };

        if (window.FB) {
            // Force re-init if ID changed (though FB.init is idempotent-ish, often can't change ID easily without reload)
            // But we try nonetheless.
            onSdkLoaded();
            return;
        }

        window.fbAsyncInit = onSdkLoaded;

        if (!document.getElementById('facebook-jssdk')) {
            const script = document.createElement('script');
            script.id = 'facebook-jssdk';
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }
    };

    const handleFacebookLogin = () => {
        if (!appId) {
            toast({ title: "Configuration Missing", description: "Please configure your Facebook App ID first.", variant: "destructive" });
            setShowConfig(true);
            return;
        }

        if (!window.FB) {
            toast({ title: "SDK Loading", description: "Facebook SDK is still loading. Please wait...", variant: "destructive" });
            return;
        }

        // Just-in-time init safeguard
        if (!window.FB_INITIALIZED) {
            try {
                window.FB.init({
                    appId: appId,
                    cookie: true,
                    xfbml: true,
                    version: 'v19.0'
                });
                window.FB_INITIALIZED = true;
            } catch (e) { console.error(e); }
        }

        setLoading(true);
        try {
            window.FB.login((response: any) => {
                if (response.authResponse) {
                    verifyToken(response.authResponse.accessToken);
                } else {
                    setLoading(false);
                    console.log('User cancelled login or did not fully authorize.');
                }
            }, { scope: 'pages_manage_metadata,pages_read_engagement,leads_retrieval,pages_show_list,ads_management' });
        } catch (error: any) {
            setLoading(false);
            console.error("FB Login Error:", error);
            const errorMessage = typeof error === 'string' ? error : error?.message || JSON.stringify(error);

            if (errorMessage.includes('http pages') || errorMessage.includes('HTTPS')) {
                toast({
                    title: "HTTPS Required",
                    description: "Facebook Login strictly requires HTTPS. If on localhost, ensure your Facebook App is in Development Mode and 'localhost' is whitelisted.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Login Error",
                    description: "An unexpected error occurred. Check console.",
                    variant: "destructive"
                });
            }
        }
    };

    const verifyToken = async (shortLivedToken: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

            // Exchange
            const exchangeRes = await axios.post(`${BACKEND_URL}/api/v1/facebook/exchange-token`, {
                shortLivedToken,
                userId: user?.id
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (exchangeRes.data.success) {
                toast({
                    title: "Facebook Connected",
                    description: "You can now configure your pages in the Facebook Campaigns tab."
                });
                await fetchIntegrations(user?.id || "");
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Connection Failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async (pageId: string) => {
        // Implement disconnect logic (delete integration from DB)
        toast({ title: "Disconnecting...", description: "Feature coming soon." });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden gap-0">
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#1877F2]/10 rounded-lg">
                            <Facebook className="w-6 h-6 text-[#1877F2]" />
                        </div>
                        <DialogTitle className="text-xl">Facebook Lead Ads</DialogTitle>
                    </div>
                    <DialogDescription className="text-zinc-400">
                        Connect your Facebook Pages to automatically trigger AI calls when new leads are captured.
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-6">
                    {/* Secure Context Warning */}
                    {!isHttps && (
                        <div className="bg-amber-900/20 text-amber-500 p-3 rounded-lg border border-amber-900/50 flex gap-2 items-start text-sm">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Insecure connection</p>
                                <p className="text-amber-500/80">Facebook Login may fail on HTTP. Use HTTPS or localhost.</p>
                            </div>
                        </div>
                    )}

                    {showConfig ? (
                        <div className="space-y-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800">
                            <h3 className="font-medium text-sm text-zinc-200">App Configuration</h3>
                            <p className="text-xs text-zinc-500">
                                Enter your Facebook App credentials from the Developer Portal.
                                Make sure your App is in Development mode if testing on localhost.
                            </p>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400">App ID</label>
                                <input
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                                    placeholder="1234567890"
                                    value={inputAppId}
                                    onChange={(e) => setInputAppId(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400">App Secret</label>
                                <input
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                                    type="password"
                                    placeholder="e.g. a1b2c3d4..."
                                    value={inputAppSecret}
                                    onChange={(e) => setInputAppSecret(e.target.value)}
                                />
                            </div>

                            {/* Webhook Configuration Info */}
                            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-3">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase">Webhook Settings (For Facebook Developer Portal)</h4>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400">Callback URL</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-black p-1.5 rounded text-xs text-zinc-300 break-all select-all">
                                            {webhookConfig.callbackUrl || "Loading..."}
                                        </code>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-400">Verify Token</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-black p-1.5 rounded text-xs text-zinc-300 select-all">
                                            {webhookConfig.verifyToken || "Loading..."}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <Button size="sm" onClick={handleSaveConfig} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Configuration"}
                                </Button>
                                {appId && (
                                    <Button size="sm" variant="ghost" onClick={() => setShowConfig(false)}>Cancel</Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Connection Status */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${connectedPages.length > 0 ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                                    <div>
                                        <div className="font-medium text-sm">Status</div>
                                        <div className="text-xs text-zinc-500">App ID: {appId}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="h-6 text-xs text-zinc-500" onClick={() => setShowConfig(true)}>
                                        Configure
                                    </Button>
                                    <Badge variant="outline" className="bg-zinc-950 border-zinc-800 text-zinc-400">
                                        {connectedPages.length > 0 ? 'Active' : 'Not Connected'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Connected Pages List */}
                            {connectedPages.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Connected Pages</h3>
                                    <ScrollArea className="h-[200px] pr-4">
                                        <div className="space-y-3">
                                            {connectedPages.map((page) => (
                                                <div key={page.page_id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-sm text-zinc-200">{page.page_name}</span>
                                                        <span className="text-xs text-zinc-500">ID: {page.page_id}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                                                        onClick={() => handleDisconnect(page.page_id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="grid gap-3">
                                {connectedPages.length === 0 ? (
                                    <Button
                                        className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white gap-2 h-11"
                                        onClick={handleFacebookLogin}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Facebook className="w-4 h-4" />}
                                        {loading ? 'Connecting...' : 'Connect Facebook Account'}
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full bg-zinc-100 hover:bg-white text-zinc-900 gap-2 h-11"
                                        onClick={handleFacebookLogin}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                        Reconnect / Add More Pages
                                    </Button>
                                )}

                                <p className="text-xs text-center text-zinc-500">
                                    You can manage detailed campaign settings in the <span className="text-zinc-300 underline cursor-pointer">Facebook Campaigns</span> tab.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
