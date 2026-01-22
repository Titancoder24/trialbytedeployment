"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Suspense } from "react";

interface SavedQuery {
    id: string;
    title: string;
    description: string | null;
    query_type?: string;
    query_data?: {
        searchTerm: string;
        filters: any;
        searchCriteria: any[];
        savedAt: string;
    };
    created_at: string;
    updated_at: string;
}

function EditQueryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryId = searchParams.get("queryId");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState<SavedQuery | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Load query data on mount
    useEffect(() => {
        const loadQuery = async () => {
            if (!queryId) {
                toast({
                    title: "Error",
                    description: "No query ID provided",
                    variant: "destructive",
                });
                return;
            }

            setLoading(true);
            try {
                // Try to fetch from API first
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/${queryId}`,
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setQuery(data.data);
                    setTitle(data.data.title || "");
                    setDescription(data.data.description || "");
                } else {
                    // Try localStorage fallback
                    const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]');
                    const localQuery = localQueries.find((q: any) => q.id === queryId);
                    if (localQuery) {
                        setQuery(localQuery);
                        setTitle(localQuery.title || "");
                        setDescription(localQuery.description || "");
                    } else {
                        toast({
                            title: "Error",
                            description: "Query not found",
                            variant: "destructive",
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading query:", error);
                // Try localStorage fallback
                const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]');
                const localQuery = localQueries.find((q: any) => q.id === queryId);
                if (localQuery) {
                    setQuery(localQuery);
                    setTitle(localQuery.title || "");
                    setDescription(localQuery.description || "");
                }
            } finally {
                setLoading(false);
            }
        };

        loadQuery();
    }, [queryId]);

    // Save updated query
    const handleSave = async () => {
        if (!query) return;

        setSaving(true);
        try {
            // Try to update in API
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/${queryId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        title,
                        description,
                    }),
                }
            );

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Query updated successfully",
                });
                // Close the tab after saving
                window.close();
            } else {
                // Update in localStorage
                const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]');
                const updatedQueries = localQueries.map((q: any) =>
                    q.id === queryId
                        ? { ...q, title, description, updated_at: new Date().toISOString() }
                        : q
                );
                localStorage.setItem('unifiedSavedQueries', JSON.stringify(updatedQueries));

                toast({
                    title: "Success",
                    description: "Query updated successfully",
                });
                window.close();
            }
        } catch (error) {
            console.error("Error saving query:", error);
            // Update in localStorage as fallback
            const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]');
            const updatedQueries = localQueries.map((q: any) =>
                q.id === queryId
                    ? { ...q, title, description, updated_at: new Date().toISOString() }
                    : q
            );
            localStorage.setItem('unifiedSavedQueries', JSON.stringify(updatedQueries));

            toast({
                title: "Success",
                description: "Query updated successfully (offline)",
            });
            window.close();
        } finally {
            setSaving(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading query...</span>
                </div>
            </div>
        );
    }

    if (!query) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Query Not Found</h2>
                    <p className="text-gray-600 mb-4">The requested query could not be found.</p>
                    <Button onClick={() => window.close()}>Close</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: "Poppins, sans-serif" }}>
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.close()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Close
                        </Button>
                        <h1 className="text-2xl font-bold" style={{ color: "#204B73" }}>
                            Edit Saved Query
                        </h1>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ backgroundColor: "#204B73" }}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Query Criteria Display (Read-only) */}
            <Card className="max-w-4xl mx-auto mb-6">
                <CardHeader style={{ backgroundColor: "#C3E9FB" }}>
                    <CardTitle className="text-lg" style={{ color: "#204B73" }}>
                        Query Criteria (Read-only)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {/* Search Term */}
                        {query.query_data?.searchTerm && (
                            <div>
                                <span className="font-medium text-gray-700">Search Term: </span>
                                <Badge variant="secondary">{query.query_data.searchTerm}</Badge>
                            </div>
                        )}

                        {/* Search Criteria */}
                        {query.query_data?.searchCriteria && query.query_data.searchCriteria.length > 0 && (
                            <div>
                                <span className="font-medium text-gray-700 block mb-2">Search Criteria:</span>
                                <div className="flex flex-wrap gap-2">
                                    {query.query_data.searchCriteria.map((criteria: any, index: number) => (
                                        <Badge key={index} variant="outline" className="text-sm">
                                            {criteria.field} {criteria.operator} "{criteria.value}"
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        {query.query_data?.filters && Object.keys(query.query_data.filters).some(key =>
                            Array.isArray(query.query_data!.filters[key]) && query.query_data!.filters[key].length > 0
                        ) && (
                                <div>
                                    <span className="font-medium text-gray-700 block mb-2">Filters:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(query.query_data.filters).map(([key, values]) =>
                                            Array.isArray(values) && values.length > 0 ? (
                                                values.map((value: string, index: number) => (
                                                    <Badge key={`${key}-${index}`} variant="outline" className="text-sm">
                                                        {key}: {value}
                                                    </Badge>
                                                ))
                                            ) : null
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Saved At */}
                        <div className="text-sm text-gray-500 pt-2 border-t">
                            Created: {formatDate(query.created_at)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Editable Fields */}
            <Card className="max-w-4xl mx-auto">
                <CardHeader style={{ backgroundColor: "#E8F5E9" }}>
                    <CardTitle className="text-lg" style={{ color: "#2E7D32" }}>
                        Edit Query Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Query Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Query Title
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter query title"
                            className="w-full"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter a description for this query"
                            className="w-full min-h-[100px]"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function EditQueryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        }>
            <EditQueryContent />
        </Suspense>
    );
}
