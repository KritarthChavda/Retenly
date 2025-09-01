'use client'

import { useState, useEffect } from "react";
import { Search, Download, Eye, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedbackItem {
  id: string;
  date: string;
  customerName: string;
  phone?: string;
  rating: number;
  feedback: string;
  sentiment: "positive" | "negative" | "neutral";
  tags?: string[];
}

interface Restaurant {
  id: string;
  name: string;
  username: string;
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return "bg-gradient-positive text-white";
    case "negative":
      return "bg-gradient-negative text-white";
    default:
      return "bg-gradient-neutral text-white";
  }
};

const getSentimentLabel = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return "Positive";
    case "negative":
      return "Negative";
    default:
      return "Neutral";
  }
};

export default function AllFeedback() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchAllFeedback();
  }, []);

  const fetchAllFeedback = async () => {
    try {
      // Fetch restaurant info first
      const restaurantResponse = await fetch('/api/restaurant/dashboard')
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json()
        setRestaurant(restaurantData.restaurant)
      }

      // Fetch all feedback
      const response = await fetch('/api/restaurant/feedbacks')
      if (response.ok) {
        const data = await response.json()
        // Transform feedback data to ensure all properties exist
        const transformedFeedback = (data.feedbacks || []).map((f: any) => ({
          id: f.id,
          date: f.createdAt,
          customerName: f.name || 'Unknown Customer',
          phone: f.phoneNumber || 'N/A',
          feedback: f.feedback || 'No text feedback',
          rating: f.rating || 3,
          sentiment: f.sentiment?.toLowerCase() || 'neutral',
          tags: []
        }));
        setAllFeedback(transformedFeedback)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter feedback based on search and filters
  const filteredFeedback = allFeedback.filter(item => {
    const matchesSearch = searchTerm === '' || 
      (item.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.feedback?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    const matchesSentiment = sentimentFilter === 'all' || item.sentiment === sentimentFilter
    const matchesRating = ratingFilter === 'all' || item.rating === parseInt(ratingFilter)
    
    return matchesSearch && matchesSentiment && matchesRating
  })

  // Pagination
  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFeedback = filteredFeedback.slice(startIndex, startIndex + itemsPerPage);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-warning text-warning" : "text-muted-foreground"
        }`}
      />
    ));
  };

  const handleExport = () => {
    // Mock export functionality
    const csvContent = [
      "Date,Customer Name,Phone,Rating,Sentiment,Feedback",
      ...filteredFeedback.map(item => 
        `${item.date},${item.customerName},${item.phone || 'N/A'},${item.rating},${item.sentiment},"${item.feedback.replace(/"/g, '""')}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "feedback_export.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Restaurant Not Found</h1>
          <p className="text-muted-foreground">Unable to load restaurant data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        restaurantName={restaurant.name}
        restaurantLogo={(restaurant as any)?.logoUrl as any}
      />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-brand-gradient bg-clip-text text-transparent">
            All Feedback
          </h1>
          <p className="text-muted-foreground">
            Manage and analyze all customer feedback for {restaurant.name}
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 bg-gradient-card border-glass">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by customer name or feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-glass"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-32 bg-background/50 border-glass">
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-24 bg-background/50 border-glass">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="5">5★</SelectItem>
                    <SelectItem value="4">4★</SelectItem>
                    <SelectItem value="3">3★</SelectItem>
                    <SelectItem value="2">2★</SelectItem>
                    <SelectItem value="1">1★</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleExport} className="bg-brand-gradient hover:opacity-90">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {paginatedFeedback.length} of {filteredFeedback.length} feedback entries
        </div>

        {/* Feedback Grid */}
        <div className="grid gap-6">
          {paginatedFeedback.map((item) => (
            <Card key={item.id} className="p-6 bg-gradient-card border-glass hover:shadow-glow transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Customer Info */}
                <div className="flex-shrink-0 lg:w-48">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{item.customerName}</h3>
                    <p className="text-sm text-muted-foreground">{item.phone || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                    <div className="flex items-center gap-1">
                      {renderStars(item.rating)}
                    </div>
                    <Badge className={getSentimentColor(item.sentiment)}>
                      {getSentimentLabel(item.sentiment)}
                    </Badge>
                  </div>
                </div>

                {/* Feedback Content */}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed mb-4">{item.feedback}</p>
                  
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFeedback(selectedFeedback === item.id ? null : item.id)}
                    className="hover:bg-glass"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {selectedFeedback === item.id ? "Hide" : "View"} Details
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedFeedback === item.id && (
                <div className="mt-4 pt-4 border-t border-glass animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Customer Details</h4>
                      <p><span className="text-muted-foreground">Name:</span> {item.customerName}</p>
                      <p><span className="text-muted-foreground">Phone:</span> {item.phone || 'N/A'}</p>
                      <p><span className="text-muted-foreground">Date:</span> {item.date}</p>
                      <p><span className="text-muted-foreground">Rating:</span> {item.rating}/5</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Analysis</h4>
                      <p><span className="text-muted-foreground">Sentiment:</span> {getSentimentLabel(item.sentiment)}</p>
                      {item.tags && (
                        <p><span className="text-muted-foreground">Tags:</span> {item.tags.join(", ")}</p>
                      )}
                      <p><span className="text-muted-foreground">Response Status:</span> Pending</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-background/50 border-glass"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-brand-gradient" : "bg-background/50 border-glass"}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-background/50 border-glass"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
