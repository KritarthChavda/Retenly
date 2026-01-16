import { Star, ThumbsUp, ThumbsDown } from "lucide-react"

interface FeedbackItem {
  id: string
  summary: string
  generatedAt: string
  themes: string[]
  confidence: number
  type: "positive" | "negative"
}

interface FeedbackHighlightsProps {
  highlights: FeedbackItem[]
}

const FeedbackCard = ({ item, type }: { item: FeedbackItem; type: "positive" | "negative" }) => {
  const isPositive = type === "positive";

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${isPositive
      ? "border-green-500/30 bg-gradient-positive/5 hover:bg-gradient-positive/10"
      : "border-red-500/30 bg-gradient-negative/5 hover:bg-gradient-negative/10"
      }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isPositive ? "bg-gradient-positive" : "bg-gradient-negative"
          }`}>
          {isPositive ? (
            <ThumbsUp className="w-4 h-4 text-white" />
          ) : (
            <ThumbsDown className="w-4 h-4 text-white" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{isPositive ? "Positive highlight" : "Needs improvement"}</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < Math.round(item.confidence * 5)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground/30"
                    }`}
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            "{item.summary}"
          </p>
          {item.themes?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.themes.map((theme) => (
                <span key={theme} className="inline-flex items-center rounded-full bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  #{theme}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground/70">
            {new Date(item.generatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};


export const FeedbackHighlights = ({ highlights }: FeedbackHighlightsProps) => {
  const positiveFeedback = highlights.filter((item) => item.type === "positive")
  const negativeFeedback = highlights.filter((item) => item.type === "negative")
  console.log(
  "NEGATIVE IDS:",
  negativeFeedback.map(i => i.id)
)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Positive Feedback */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-positive">
            <ThumbsUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Top 3 Positive Feedback</h3>
        </div>

        <div className="space-y-3">
          {positiveFeedback.slice(0, 3).map((item) => (
            <FeedbackCard
              key={`${item.id}-positive`}
              item={item}
              type="positive"
            />
          ))}
        </div>
      </div>

      {/* Negative Feedback */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-negative">
            <ThumbsDown className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Top 3 Negative Feedback</h3>
        </div>

        <div className="space-y-3">
          {negativeFeedback.slice(0, 3).map((item) => (
            <FeedbackCard
              key={`${item.id}-negative`}
              item={item}
              type="negative"
            />
          ))
          }
        </div>
      </div>
    </div>
  );
};


