"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Search,
  Filter,
  Save,
  X,
  Settings,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  dropdownManagementAPI, 
  DropdownCategory, 
  DropdownOption 
} from '@/lib/dropdown-management-api';

// Define the dropdown categories organized by tabs
const DROPDOWN_CATEGORIES_BY_TAB = {
  'Trial Overview': [
    'therapeutic_area',
    'trial_phase', 
    'trial_status',
    'disease_type',
    'patient_segment',
    'line_of_therapy',
    'trial_tags',
    'sponsor_collaborators',
    'sponsor_field_activity',
    'associated_cro',
    'country',
    'region',
    'trial_record_status'
  ],
  'Outcome Measured': [
    'study_design_keywords'
  ],
  'Participation Criteria': [
    'sex',
    'healthy_volunteers'
  ],
  'Results': [
    'trial_outcome',
    'result_type',
    'adverse_event_reported',
    'adverse_event_type'
  ]
};

export default function DropdownManagementConsole() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<DropdownCategory[]>([]);
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Trial Overview');

  // Dialog states
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);

  // Form states
  const [optionForm, setOptionForm] = useState({
    categoryName: '',
    value: '',
    label: '',
    description: '',
    sortOrder: 0,
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, optionsResponse] = await Promise.all([
        dropdownManagementAPI.getCategories(),
        dropdownManagementAPI.getOptions(),
      ]);

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      if (optionsResponse.success && optionsResponse.data) {
        setOptions(optionsResponse.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dropdown data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Option management
  const handleCreateOption = async () => {
    try {
      const response = await dropdownManagementAPI.createOption(optionForm);
      if (response.success) {
        toast({
          title: "Success",
          description: "Option created successfully",
        });
        setIsOptionDialogOpen(false);
        setOptionForm({ categoryName: '', value: '', label: '', description: '', sortOrder: 0 });
        loadData();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create option",
        variant: "destructive",
      });
    }
  };

  // Handle adding option for specific category
  const handleAddOptionForCategory = (categoryName: string) => {
    setEditingOption(null);
    setOptionForm({ 
      categoryName: categoryName, 
      value: '', 
      label: '', 
      description: '', 
      sortOrder: 0 
    });
    setIsOptionDialogOpen(true);
  };

  const handleUpdateOption = async () => {
    if (!editingOption) return;

    try {
      const response = await dropdownManagementAPI.updateOption(editingOption.id, {
        ...optionForm,
        isActive: true,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Option updated successfully",
        });
        setIsOptionDialogOpen(false);
        setEditingOption(null);
        setOptionForm({ categoryName: '', value: '', label: '', description: '', sortOrder: 0 });
        loadData();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update option",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOption = async (id: number) => {
    try {
      const response = await dropdownManagementAPI.deleteOption(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Option deleted successfully",
        });
        loadData();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete option",
        variant: "destructive",
      });
    }
  };

  // Get options for current tab
  const getCurrentTabOptions = () => {
    const currentTabCategories = DROPDOWN_CATEGORIES_BY_TAB[activeTab as keyof typeof DROPDOWN_CATEGORIES_BY_TAB] || [];
    return options.filter(option => 
      currentTabCategories.includes(option.category_name || '') &&
      (!searchTerm || 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.category_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const categoryOptions: SearchableSelectOption[] = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
  }));

  const getCategoryDisplayName = (categoryName: string) => {
    const displayNames: Record<string, string> = {
      'therapeutic_area': 'Therapeutic Area',
      'trial_phase': 'Trial Phase',
      'trial_status': 'Status',
      'disease_type': 'Disease Type',
      'patient_segment': 'Patient Segment',
      'line_of_therapy': 'Line of Therapy',
      'trial_tags': 'Trial Tags',
      'sponsor_collaborators': 'Sponsor and Collaborators',
      'sponsor_field_activity': 'Sponsor Field of Activity',
      'associated_cro': 'Associated CRO',
      'country': 'Countries',
      'region': 'Region',
      'trial_record_status': 'Trial Record Status',
      'study_design_keywords': 'Study Design Keywords',
      'sex': 'Sex',
      'healthy_volunteers': 'Healthy Volunteers',
      'registry_type': 'Registry Type',
      'trial_outcome': 'Trial Outcome',
      'result_type': 'Result Type',
      'adverse_event_reported': 'Adverse Event Reported',
      'adverse_event_type': 'Adverse Event Type',
      'log_type': 'Type'
    };
    return displayNames[categoryName] || categoryName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dropdown Management Console</h1>
          <p className="text-gray-600 mt-2">Manage dropdown options used across the application forms and filters</p>
        </div>
        <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
          <DialogTrigger asChild>
            <div style={{ display: 'none' }} />
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOption ? 'Edit Option' : 'Add New Option'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="option-value">Value</Label>
                <Input
                  id="option-value"
                  value={optionForm.value}
                  onChange={(e) => setOptionForm({ ...optionForm, value: e.target.value })}
                  placeholder="Enter option value"
                />
              </div>
              <div>
                <Label htmlFor="option-label">Label</Label>
                <Input
                  id="option-label"
                  value={optionForm.label}
                  onChange={(e) => setOptionForm({ ...optionForm, label: e.target.value })}
                  placeholder="Enter option label"
                />
              </div>
              <div>
                <Label htmlFor="option-description">Description</Label>
                <Textarea
                  id="option-description"
                  value={optionForm.description}
                  onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
                  placeholder="Enter option description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="option-sort">Sort Order</Label>
                <Input
                  id="option-sort"
                  type="number"
                  value={optionForm.sortOrder}
                  onChange={(e) => setOptionForm({ ...optionForm, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="Enter sort order"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOptionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingOption ? handleUpdateOption : handleCreateOption}>
                  {editingOption ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="Trial Overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Trial Overview
          </TabsTrigger>
          <TabsTrigger value="Outcome Measured" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Outcome Measured
          </TabsTrigger>
          <TabsTrigger value="Participation Criteria" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participation Criteria
          </TabsTrigger>
          <TabsTrigger value="Results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {Object.keys(DROPDOWN_CATEGORIES_BY_TAB).map((tabName) => (
          <TabsContent key={tabName} value={tabName} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {tabName} Dropdowns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {DROPDOWN_CATEGORIES_BY_TAB[tabName as keyof typeof DROPDOWN_CATEGORIES_BY_TAB].map((categoryName) => {
                    const categoryOptions = getCurrentTabOptions().filter(opt => opt.category_name === categoryName);
                    const category = categories.find(cat => cat.name === categoryName);
                    
                    return (
                      <div key={categoryName} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{getCategoryDisplayName(categoryName)}</h3>
                            {category?.description && (
                              <p className="text-sm text-gray-600">{category.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAddOptionForCategory(categoryName)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Option
                            </Button>
                            <Badge variant="secondary">
                              {categoryOptions.length} options
                            </Badge>
                          </div>
                        </div>
                        
                        {categoryOptions.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {categoryOptions.map((option) => (
                              <div key={option.id} className="flex items-start justify-between p-3 border rounded-md bg-gray-50 gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium break-words">{option.label}</div>
                                  <div className="text-sm text-gray-500 font-mono break-all">{option.value}</div>
                                  {option.description && (
                                    <div className="text-xs text-gray-400 mt-1 break-words">{option.description}</div>
                                  )}
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingOption(option);
                                        setOptionForm({
                                          categoryName: option.category_name || '',
                                          value: option.value,
                                          label: option.label,
                                          description: option.description || '',
                                          sortOrder: option.sort_order,
                                        });
                                        setIsOptionDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteOption(option.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>No options found for this category.</p>
                            <p className="text-sm">Add options using the "Add Option" button above.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}