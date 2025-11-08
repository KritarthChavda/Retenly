'use client'

import { useMemo, useState } from 'react'
import { Search, Star, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { date } from 'zod/v4'

interface FeedbackItem {
  id: string;
  date: string;
  customerName: string;
  rating: number;
  feedback: string;
  sentiment: "positive" | "negative" | "neutral";
}

interface RecentFeedbackTableProps {
  data: FeedbackItem[];
}

export function RecentFeedbackTable({ data }: RecentFeedbackTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter data based on search term
  const filteredData = data.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (item.customerName?.toLowerCase() || '').includes(searchLower) ||
      (item.feedback?.toLowerCase() || '').includes(searchLower) ||
      item.sentiment?.toLowerCase().includes(searchLower)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  const dateFormatter = useMemo(() =>
    new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }),
    []);

  const getSentimentBadge = (sentiment: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";

    switch (sentiment) {
      case "positive":
        return (
          <span className={`${baseClasses} bg-gradient-positive/20 text-green-400 border border-green-500/30`}>
            😊 Positive
          </span>
        );
      case "negative":
        return (
          <span className={`${baseClasses} bg-gradient-negative/20 text-red-400 border border-red-500/30`}>
            😞 Negative
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gradient-neutral/20 text-yellow-400 border border-yellow-500/30`}>
            😐 Neutral
          </span>
        );
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating
            ? "text-yellow-400 fill-yellow-400"
            : "text-muted-foreground/30"
            }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">Recent Feedback</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card/50 border-glass"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-glass bg-card/30 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-card border-b border-glass">
              <tr className="hover:bg-transparent">
                <th className="text-left p-4 text-foreground font-semibold">Date</th>
                <th className="text-left p-4 text-foreground font-semibold">Customer</th>
                <th className="text-left p-4 text-foreground font-semibold">Rating</th>
                <th className="text-left p-4 text-foreground font-semibold">Sentiment</th>
                <th className="text-left p-4 text-foreground font-semibold">Feedback</th>
                <th className="text-right p-4 text-foreground font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-glass/50 hover:bg-gradient-card/50 transition-colors"
                >
                  <td className="p-4 text-muted-foreground">
                    {dateFormatter.format(new Date(item.date))}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.customerName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <StarRating rating={item.rating} />
                  </td>
                  <td className="p-4">
                    {getSentimentBadge(item.sentiment)}
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">
                      {item.feedback}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-gradient-card border border-transparent hover:border-glass"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-card/50 border-glass hover:bg-gradient-card"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <span className="text-sm px-3 py-1 bg-gradient-card border border-glass rounded-lg">
              {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-card/50 border-glass hover:bg-gradient-card"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
