"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun, Save, Trash2, Copy, Play, Settings } from "lucide-react";
import Footer from "@/components/Footer";

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
}

interface SavedEndpoint {
  id: string;
  url: string;
  method: string;
  body?: string;
  name: string;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </motion.div>
  );
}

export default function Home() {
  const { theme } = useTheme();
  // ...removed modal state...
  // State for endpoint name input
  const [endpointName, setEndpointName] = useState("");
  // Notification state
  const [notification, setNotification] = useState<string | null>(null);

  // Headers and presets
  const [headers, setHeaders] = useState<Record<string, string>>({ "Content-Type": "application/json" });
  const headerPresets: Record<string, Record<string, string>> = {
    JSON: { "Content-Type": "application/json" },
    Form: { "Content-Type": "application/x-www-form-urlencoded" },
    "Auth: Bearer": { "Authorization": "Bearer <token>" },
  };
  const [selectedHeaderPreset, setSelectedHeaderPreset] = useState<string | null>(null);
  const [headersRaw, setHeadersRaw] = useState<string>(JSON.stringify(headers, null, 2));

  // Request history
  const [requestHistory, setRequestHistory] = useState<Array<any>>([]);

  // Response pretty print toggle
  const [prettyPrint, setPrettyPrint] = useState(true);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quickDeleteEnabled, setQuickDeleteEnabled] = useState(false);

  // State for confirm delete modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // Clear history confirmation modal
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isConfirmModalOpen) {
          setIsConfirmModalOpen(false);
          setConfirmDeleteId(null);
        }
        if (isClearHistoryModalOpen) {
          setIsClearHistoryModalOpen(false);
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmModalOpen, isSettingsOpen, isClearHistoryModalOpen]);
  

  // keep raw headers synced
  useEffect(() => {
    setHeadersRaw(JSON.stringify(headers, null, 2));
  }, [headers]);

        // Show notification for a short time
        const showNotification = (msg: string) => {
          setNotification(msg);
          setTimeout(() => setNotification(null), 2000);
        };
      // Color palette for endpoints
      const methodColors: Record<string, string> = {
        GET: "#60a5fa",      // blue
        POST: "#34d399",     // green
        PUT: "#fbbf24",      // yellow
        DELETE: "#f87171",   // red
        PATCH: "#a78bfa",    // purple
        HEAD: "#38bdf8",     // sky
        OPTIONS: "#fb923c",  // orange (distinct from red)
        DEFAULT: "#4ade80"   // emerald
      };

      // Assign color by method
      const getEndpointColor = (method: string) => methodColors[method] || methodColors.DEFAULT;
  // ...existing code...

  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  // Search state for saved endpoints
  const [endpointSearch, setEndpointSearch] = useState("");
  const [savedEndpoints, setSavedEndpoints] = useState<SavedEndpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcuts: Cmd/Ctrl+Enter to send, Cmd/Ctrl+S to save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        if (url) sendRequest();
      }
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (url) saveEndpoint();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [url, method, body, headers]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  const responseVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  // Helper functions
  const saveEndpoint = () => {
    if (!url.trim()) return;
    const newEndpoint: SavedEndpoint = {
      id: Math.random().toString(36).slice(2),
      url,
      method,
      body,
      name: url
    };
    setSavedEndpoints(prev => [...prev, newEndpoint]);
  };

  const handleConfirmSave = () => {
    const newEndpoint: SavedEndpoint = {
      id: Math.random().toString(36).slice(2),
      url,
      method,
      body,
      name: saveModalName.trim() || url
    };
    setSavedEndpoints(prev => [...prev, newEndpoint]);
    setIsSaveModalOpen(false);
    setSaveModalName("");
  };

  const handleCancelSave = () => {
    setIsSaveModalOpen(false);
  };

  const loadEndpoint = (endpoint: SavedEndpoint) => {
    setUrl(endpoint.url);
    setMethod(endpoint.method);
    setBody(endpoint.body || "");
  };

  const runEndpoint = async (endpoint: SavedEndpoint) => {
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (endpoint.method !== "GET" && endpoint.method !== "HEAD" && endpoint.body) {
        options.body = endpoint.body;
      }

      const res = await fetch(endpoint.url, options);
      const data = await res.text();

      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = data;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: parsedData,
      });
      // push to history
      setRequestHistory(prev => [{ id: Math.random().toString(36).slice(2), url: endpoint.url, method: endpoint.method, body: endpoint.body, headers }, ...prev].slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyEndpoint = (endpoint: SavedEndpoint) => {
    // Remove trailing backslash if present
    const cleanUrl = endpoint.url.replace(/\\+$/, "");
    navigator.clipboard.writeText(cleanUrl);
    showNotification("URL copied to clipboard!");
  };

  const buildCurl = ({ url, method, headers, body }: { url: string; method: string; headers?: Record<string,string>; body?: string; }) => {
    const parts = ["curl"];
    parts.push("-X");
    parts.push(method);
    if (headers) {
      for (const k of Object.keys(headers)) {
        const v = headers[k];
        parts.push(`-H "${k}: ${v}"`);
      }
    }
    if (body && body.trim()) {
      parts.push(`--data '${body.replace(/'/g, "'\\''")}'`);
    }
    parts.push(`"${url}"`);
    return parts.join(" ");
  };


  // Show confirm modal instead of deleting immediately
  const requestDeleteEndpoint = (id: string) => {
    if (quickDeleteEnabled) {
      // perform delete immediately
      setSavedEndpoints(prev => prev.filter(ep => ep.id !== id));
      showNotification("Endpoint deleted");
      return;
    }
    setConfirmDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      setSavedEndpoints(prev => prev.filter(ep => ep.id !== confirmDeleteId));
    }
    setIsConfirmModalOpen(false);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setConfirmDeleteId(null);
  };

  const sendRequest = async () => {
    if (!url) return;

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      // add keyboard shortcut handler elsewhere; ensure headers are valid
      const options: RequestInit = {
        method,
        headers: headers as Record<string, string>,
      };

      if (method !== "GET" && method !== "HEAD" && body) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const data = await res.text();

      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = data;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: parsedData,
      });
      // push to history
      setRequestHistory(prev => [{ id: Math.random().toString(36).slice(2), url, method, body, headers }, ...prev].slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen relative flex flex-col" 
      style={{ backgroundImage: 'url(/stars.avif)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="absolute inset-0 z-0 dark:hidden" style={{ backgroundImage: 'url(/stars.avif)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: 'invert(1)' }}></div>
      <div className="absolute inset-0 z-1 bg-white/90 dark:bg-neutral-900/97"></div>
      <motion.div className="relative z-10 flex flex-col flex-1">
        <main className="flex-1">
        <motion.header 
          className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
          variants={cardVariants}
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
            <motion.h1 
              className="text-2xl font-bold text-blue-400"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Star API
            </motion.h1>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsSettingsOpen(true)}
                    title="Settings"
                  >
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Open settings</span>
                  </Button>
                </div>
              </motion.div>
              <ThemeToggle />
            </div>
          </div>
        </motion.header>

        <motion.div 
          className="container mx-auto p-4 max-w-6xl"
          variants={containerVariants}
        >
          <motion.div variants={cardVariants}>
            <Card className="mb-6 backdrop-blur-lg bg-white/10 dark:bg-black/20 border-white/20">
              <CardHeader>
                <CardTitle>Request</CardTitle>
                <CardDescription>Configure your API request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Enter API URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 font-mono"
                  />
                  <div className="w-48">
                    <select
                      value={selectedHeaderPreset || ""}
                      onChange={(e) => {
                        const key = e.target.value;
                        setSelectedHeaderPreset(key || null);
                        if (key && headerPresets[key]) setHeaders(headerPresets[key]);
                      }}
                      className="w-full rounded px-3 py-2 text-sm bg-gray-100 border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700"
                    >
                      <option value="">Header Preset</option>
                      {Object.keys(headerPresets).map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" onClick={sendRequest} disabled={loading || !url}>
                      {loading ? "Sending..." : "Send"}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" onClick={() => {
                      const curl = buildCurl({ url, method, headers, body });
                      navigator.clipboard.writeText(curl);
                      showNotification("cURL copied to clipboard!");
                    }}>Copy as cURL</Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button onClick={saveEndpoint} disabled={!url.trim()} variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </motion.div>
                </div>

                {(method === "POST" || method === "PUT" || method === "PATCH") && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Request Body (JSON)</label>
                    <Textarea
                      placeholder="Enter JSON body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="font-mono"
                      rows={6}
                    />
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-2">Headers (JSON)</label>
                      <Textarea
                        placeholder='{"Content-Type":"application/json"}'
                        value={headersRaw}
                        onChange={(e) => {
                          setHeadersRaw(e.target.value);
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setHeaders(parsed);
                          } catch (err) {
                            // ignore parse errors until valid
                          }
                        }}
                        rows={4}
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="mb-6 backdrop-blur-lg bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-6">
                    <p className="text-red-600">Error: {error}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          

          <AnimatePresence>
            {response && (
              <motion.div
                variants={responseVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Card className="backdrop-blur-lg bg-white/10 dark:bg-black/20 border-white/20">
                  <CardHeader>
                    <CardTitle>Response</CardTitle>
                    <CardDescription>
                      Status: {response.status} {response.statusText}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="body" className="w-full">
                      <TabsList>
                        <TabsTrigger value="body">Body</TabsTrigger>
                        <TabsTrigger value="headers">Headers</TabsTrigger>
                      </TabsList>
                      <TabsContent value="body" className="mt-4">
                        <div className="flex items-center justify-end mb-2 gap-2">
                          <Button size="sm" variant="outline" onClick={() => setPrettyPrint(p => !p)}>{prettyPrint ? 'Raw' : 'Pretty'}</Button>
                        </div>
                        <motion.pre 
                          className="bg-white dark:bg-neutral-900 p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap font-mono"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {(() => {
                            const d = response.data;
                            if (prettyPrint) {
                              try { return typeof d === 'string' ? JSON.stringify(JSON.parse(d), null, 2) : JSON.stringify(d, null, 2); } catch { return typeof d === 'string' ? d : JSON.stringify(d, null, 2); }
                            }
                            return typeof d === 'string' ? d : JSON.stringify(d);
                          })()}
                        </motion.pre>
                      </TabsContent>
                      <TabsContent value="headers" className="mt-4">
                        <motion.pre 
                          className="bg-white dark:bg-neutral-900 p-4 rounded overflow-auto max-h-96 font-mono"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {JSON.stringify(response.headers, null, 2)}
                        </motion.pre>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {savedEndpoints.length > 0 && (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Card className="mt-6 backdrop-blur-lg bg-white/10 dark:bg-black/20 border-white/20">
                  <CardHeader>
                    <CardTitle>Saved Endpoints</CardTitle>
                    <CardDescription>Your saved API endpoints</CardDescription>
                    <div className="mt-3 w-full max-w-lg flex items-center gap-2">
                      <Input
                        placeholder="Search endpoints by name or URL..."
                        value={endpointSearch}
                        onChange={(e) => setEndpointSearch(e.target.value)}
                      />
                      <Button size="sm" variant="outline" onClick={() => {
                        // export
                        const data = JSON.stringify(savedEndpoints, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'saved_endpoints.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}>Export</Button>
                      <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            try {
                              const parsed = JSON.parse(String(reader.result));
                              if (Array.isArray(parsed)) setSavedEndpoints(parsed);
                              showNotification('Imported endpoints');
                            } catch (err) {
                              showNotification('Import failed');
                            }
                          };
                          reader.readAsText(f);
                        }}
                      />
                      <Button size="sm" onClick={() => importInputRef.current?.click()}>Import</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className={savedEndpoints.length > 10 ? "space-y-2 max-h-96 overflow-y-auto pr-2" : "space-y-2"}
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <AnimatePresence>
                        {savedEndpoints
                          .filter(ep => {
                            const q = endpointSearch.trim().toLowerCase();
                            if (!q) return true;
                            return ep.url.toLowerCase().includes(q) || ep.name.toLowerCase().includes(q);
                          })
                          .map((endpoint, index) => (
                          <div 
                            key={endpoint.id} 
                            className="relative flex items-center justify-between p-3 border rounded-lg backdrop-blur-sm bg-white/5 dark:bg-black/10 border-white/10"
                          >
                            {quickDeleteEnabled && (
                              <button
                                onClick={() => requestDeleteEndpoint(endpoint.id)}
                                aria-label="Delete endpoint"
                                title="Delete endpoint"
                                className={
                                  `absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] leading-none flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ` +
                                  (theme === "dark"
                                    ? "bg-white text-black"
                                    : "bg-black text-white")
                                }
                              >
                                ×
                              </button>
                            )}
                            <div className="flex-1">
                              <button
                                onClick={() => loadEndpoint(endpoint)}
                                className="text-left w-full"
                              >
                                <div className="flex items-center gap-2">
                                            <span
                                              className="rounded-sm px-2 py-1 text-xs font-mono"
                                              style={{ background: getEndpointColor(endpoint.method), color: "#fff" }}
                                            >
                                              {endpoint.method}
                                            </span>
                                            <span className="ml-2 text-sm truncate font-mono">{endpoint.url}</span>
                                </div>
                              </button>
                            </div>
                            <div className="flex items-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <circle cx="4" cy="10" r="2" fill="currentColor" />
                                      <circle cx="10" cy="10" r="2" fill="currentColor" />
                                      <circle cx="16" cy="10" r="2" fill="currentColor" />
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => runEndpoint(endpoint)}>
                                    Run
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => copyEndpoint(endpoint)}>
                                    Copy URL
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    const curl = buildCurl({ url: endpoint.url, method: endpoint.method, body: endpoint.body, headers });
                                    navigator.clipboard.writeText(curl);
                                    showNotification('cURL copied to clipboard!');
                                  }}>
                                    Copy as cURL
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => requestDeleteEndpoint(endpoint.id)} className="text-red-600">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
        </main>
        {/* Request History */}
        <motion.div className="container mx-auto p-4 max-w-6xl" variants={cardVariants} initial="hidden" animate="visible">
          <Card className="mt-6 backdrop-blur-lg bg-white/10 dark:bg-black/20 border-white/20">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="mb-1.5">Request History</CardTitle>
                <CardDescription>Recent requests (click to load or run)</CardDescription>
              </div>
                <div>
                <Button size="sm" variant="destructive" onClick={() => setIsClearHistoryModalOpen(true)} disabled={requestHistory.length === 0}>Clear</Button>
                </div>
            </CardHeader>
            <CardContent>
              {requestHistory.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No recent requests</div>
              ) : (
                <div className={requestHistory.length > 5 ? "space-y-2 max-h-96 overflow-y-auto pr-2" : "space-y-2"}>
                  {requestHistory.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <button className="text-left w-full" onClick={() => { setUrl(h.url); setMethod(h.method); setBody(h.body || ""); setHeaders(h.headers || {}); }}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono">{h.method}</span>
                            <span className="text-sm truncate font-mono">{h.url}</span>
                          </div>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => runEndpoint(h)}>Run</Button>
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(buildCurl({ url: h.url, method: h.method, headers: h.headers, body: h.body })); showNotification('cURL copied'); }}>cURL</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Confirm Delete Modal */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-sm shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-center">Are you sure you want to delete?</h2>
              <p className="mb-6 text-center">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelDelete}>Cancel</Button>
                <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
              </div>
            </div>
          </div>
        )}
        {/* Clear History Confirmation Modal */}
        {isClearHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-sm shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-center">Clear request history?</h2>
              <p className="mb-6 text-center">This will remove all recent requests. This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsClearHistoryModalOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => { setRequestHistory([]); setIsClearHistoryModalOpen(false); showNotification('Request history cleared'); }}>Clear</Button>
              </div>
            </div>
          </div>
        )}
        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span>Quick delete (no confirmation)</span>
                  <input
                    type="checkbox"
                    checked={quickDeleteEnabled}
                    onChange={(e) => setQuickDeleteEnabled(e.target.checked)}
                    className="w-5 h-5"
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Close</Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Notification UI */}
        {notification && (
          <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
            {notification}
          </div>
        )}
        <Footer />
      </motion.div>
    </motion.div>
  );
}
