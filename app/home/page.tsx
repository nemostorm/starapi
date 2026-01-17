"use client";

import { useState, useEffect } from "react";
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
import { Moon, Sun, Save, Trash2, Copy, Play } from "lucide-react";
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
  // ...removed modal state...
  // State for endpoint name input
  const [endpointName, setEndpointName] = useState("");
  // Notification state
  const [notification, setNotification] = useState<string | null>(null);

  // State for confirm delete modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Close delete modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isConfirmModalOpen) {
          setIsConfirmModalOpen(false);
          setConfirmDeleteId(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmModalOpen]);

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
  const [savedEndpoints, setSavedEndpoints] = useState<SavedEndpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);

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


  // Show confirm modal instead of deleting immediately
  const requestDeleteEndpoint = (id: string) => {
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
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
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
          className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
          variants={cardVariants}
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
            <motion.h1 
              className="text-2xl font-bold"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              StarAPI
            </motion.h1>
            <ThemeToggle />
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
                    className="flex-1"
                  />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button onClick={sendRequest} disabled={loading || !url}>
                      {loading ? "Sending..." : "Send"}
                    </Button>
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
                      rows={6}
                    />
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
                        <motion.pre 
                          className="bg-white dark:bg-neutral-900 p-4 rounded overflow-auto max-h-96"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {typeof response.data === "string"
                            ? response.data
                            : JSON.stringify(response.data, null, 2)}
                        </motion.pre>
                      </TabsContent>
                      <TabsContent value="headers" className="mt-4">
                        <motion.pre 
                          className="bg-white dark:bg-neutral-900 p-4 rounded overflow-auto max-h-96"
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
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="space-y-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <AnimatePresence>
                        {savedEndpoints.map((endpoint, index) => (
                          <motion.div 
                            key={endpoint.id} 
                            className="flex items-center justify-between p-3 border rounded-lg backdrop-blur-sm bg-white/5 dark:bg-black/10 border-white/10"
                            variants={cardVariants}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex-1">
                              <motion.button
                                onClick={() => loadEndpoint(endpoint)}
                                className="text-left hover:text-blue-600 dark:hover:text-blue-400 w-full"
                                whileHover={{ x: 5 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="rounded-sm px-2 py-1 text-xs font-mono"
                                    style={{ background: getEndpointColor(endpoint.method), color: "#fff" }}
                                  >
                                    {endpoint.method}
                                  </span>
                                  <span
                                    className="rounded-sm px-2 py-1 text-xs font-mono"
                                    style={{ background: getEndpointColor(endpoint.method), color: "#fff" }}
                                  >
                                    {endpoint.url}
                                  </span>
                                </div>
                              </motion.button>
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
                                    Copy
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => requestDeleteEndpoint(endpoint.id)} className="text-red-600">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
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
