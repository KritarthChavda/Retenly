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
  logoUrl?: string;
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
  const [error, setError] = useState('');
  const itemsPerPage = 8;

  useEffect(() => {
    fetchAllFeedback();
  }, []);

  const fetchAllFeedback = async () => {
    try {
      const response = await fetch('/api/restaurant/feedbacks', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
        const transformedFeedback = (data.feedbacks || []).map((f: any) => ({
          id: f.id,
          date: f.createdAt,
          customerName: f.name || 'Anonymous',
          phone: f.phoneNumber || 'N/A',
          feedback: f.feedback || 'No text feedback',
          rating: f.rating || 3,
          sentiment: f.sentiment?.toLowerCase() || 'neutral',
          tags: []
        }));
        setAllFeedback(transformedFeedback);
      } else {
        console.error('Failed to fetch feedback data:', response.status);
        setError('Failed to load feedback data');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError('An error occurred while loading feedback data');
    } finally {
      setIsLoading(false);
    }
  };

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
        className={`w-4 h-4 ${i < rating ? "fill-warning text-warning" : "text-muted-foreground"
          }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header restaurantName="Loading..." />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading feedback data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header restaurantName="Error" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchAllFeedback} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header restaurantName={restaurant?.name || "Restaurant"} />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">All Feedback</h1>
            <p className="text-muted-foreground">
              View and manage all customer feedback for {restaurant?.name || 'your restaurant'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Sentiments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Showing {filteredFeedback.length} of {allFeedback.length} feedback entries
          </p>
        </div>

        {/* Feedback Table */}
        {filteredFeedback.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
              <p>
                {allFeedback.length === 0 
                  ? "No feedback has been submitted yet. Share your feedback form with customers to start collecting feedback."
                  : "No feedback matches your current filters. Try adjusting your search criteria."
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedFeedback.map((feedback) => (
              <Card key={feedback.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {feedback.customerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{feedback.customerName}</h3>
                          <p className="text-sm text-muted-foreground">{feedback.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSentimentColor(feedback.sentiment)}>
                          {getSentimentLabel(feedback.sentiment)}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {renderStars(feedback.rating)}
                        </div>
                      </div>
                    </div>
                    <p className="text-foreground mb-3 line-clamp-2">{feedback.feedback}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{new Date(feedback.date).toLocaleDateString()}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFeedback(selectedFeedback === feedback.id ? null : feedback.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {selectedFeedback === feedback.id ? 'Hide' : 'View'} Details
                      </Button>
                    </div>
                  </div>
                </div>
                {selectedFeedback === feedback.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Feedback Details</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Date:</strong> {new Date(feedback.date).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Rating:</strong> {feedback.rating}/5 stars
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Sentiment:</strong> {getSentimentLabel(feedback.sentiment)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Full Feedback</h4>
                        <p className="text-sm text-foreground">{feedback.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}