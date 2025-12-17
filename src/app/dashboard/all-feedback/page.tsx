'use client'

import { useState } from "react";
import { Search, Download, Eye, Star, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useDashboard } from "@/context/DashboardContext";
import { VoiceRecordingPlayer } from "@/components/dashboard/VoiceRecordingPlayer";

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
  const { restaurant, allFeedback } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  
  const itemsPerPage = 8;

  if (!restaurant || !allFeedback) {
    return null; // Or a loading/error state
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
        className={`w-4 h-4 ${i < rating
          ? "text-yellow-400 fill-yellow-400"
          : "text-muted-foreground/30"
          }`}
      />
    ));
  };

  const handleExport = () => {
    const csvContent = [
      "Date,Customer Name,Rating,Sentiment,Feedback",
      ...filteredFeedback.map(item =>
        `${item.date},${item.customerName},${item.rating},${item.sentiment},"${item.feedback.replace(/"/g, '""')}"`
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

  return (
    <div className="min-h-screen bg-background">
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
            <Button onClick={handleExport} className="bg-brand-gradient hover:opacity-90">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
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
              <SelectContent className="z-[100]">
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
              <SelectContent className="z-[100]">
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
                        <div>
                          <h3 className="font-semibold text-foreground">{feedback.customerName}</h3>
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
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Sentiment:</strong> {getSentimentLabel(feedback.sentiment)}
                        </p>
                        {feedback.voiceRecordingUrl && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-1.5">
                              <strong>Voice Recording:</strong>
                            </p>
                            <VoiceRecordingPlayer src={feedback.voiceRecordingUrl} />
                          </div>
                        )}
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
