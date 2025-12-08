import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Twitter, Facebook, Instagram, ArrowLeft } from "lucide-react";
import thankYouImage from "@/assets/thank-you-celebration.png";
import Confetti from "./Confetti";

interface ThankYouPageProps {
  onBack: () => void;
  restaurantName?: string;
  customerName?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

export default function ThankYouPage({
  onBack,
  restaurantName = "Downtown Rajkot",
  customerName = "friend",
  socialLinks = {},
}: ThankYouPageProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [ready, setReady] = useState(false); // avoid initial button flash

  useEffect(() => {
    // snap to top when this page mounts
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      setShareUrl(window.location.href);
      setReady(true);
    }
  }, []);

  const shareText = `I just shared my amazing experience at ${restaurantName}! 🍽️✨`;

  const handleShare = (platform: "twitter" | "facebook" | "native") => {
    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "native":
        if (navigator.share) {
          navigator
            .share({
              title: `Feedback for ${restaurantName}`,
              text: shareText,
              url: shareUrl,
            })
            .catch(() => {});
          return;
        }
        break;
    }
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-slate-900 px-4 pt-8 relative overflow-visible" data-testid="thank-you-screen">
      {/* Keep mounted; Confetti fades out internally (no flicker) */}
      <Confetti />

      <div className="max-w-2xl mx-auto text-center space-y-6">
        {/* Image */}
        <div className="flex justify-center">
          <img
            src={thankYouImage.src}
            alt="Thank you!"
            className="w-48 h-auto sm:w-64 object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Heading */}
        <h1
          aria-live="polite"
          className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight
                     bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent
                     selection:bg-pink-500/30 selection:text-white"
        >
          <span>Thank You, </span>
          <span className="whitespace-nowrap">{customerName}!</span>
          <span aria-hidden className="align-middle pl-2">🎉</span>
        </h1>

        {/* Subhead */}
        <p className="text-lg sm:text-xl text-slate-300">
          Your feedback means the world to us at{" "}
          <span className="font-semibold text-white">{restaurantName}</span>
        </p>

        {/* Success Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 bg-slate-800/80 border border-slate-700/60 shadow-xl"
        >
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center
                          bg-gradient-to-r from-yellow-400 to-pink-500 shadow-md mb-4">
            <span className="text-2xl">✨</span>
          </div>

          <h2 className="text-2xl font-semibold text-white">Feedback Received!</h2>
          <p className="text-slate-300 mt-2">
            We’ve received your valuable feedback and our team will review it to make your next visit even better.
          </p>

          {/* What's Next */}
          <div className="mt-6 bg-slate-700/30 rounded-lg p-6 space-y-3 text-left">
            <h3 className="font-semibold text-lg text-white">What happens next?</h3>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</span>
                <span className="text-slate-300">We’ll review your feedback within 24 hours.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">ℹ︎</span>
                <span className="text-slate-300">If you provided contact info, we may reach out to follow up.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">★</span>
                <span className="text-slate-300">Your insights help us improve for all our guests.</span>
              </li>
            </ul>
          </div>

          {/* Divider */}
          <hr className="my-6 border-slate-700/60" />

          {/* Share row (render only when ready to avoid flash) */}
          {ready && (
            <div
              className="space-y-3 [transform:translateZ(0)] will-change-transform"
            >
              <h3 className="text-lg font-semibold text-white">Share your experience</h3>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => handleShare("native")} className="px-4">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare("twitter")}
                  className="hover:text-blue-400"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare("facebook")}
                  className="hover:text-blue-500"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>

                {socialLinks.instagram && (
                  <Button
                    asChild
                    variant="outline"
                    className="hover:text-pink-400"
                    title="Follow us on Instagram"
                  >
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="w-4 h-4 mr-2" />
                      Follow us
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="pt-2">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center space-x-2 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Submit Another Feedback</span>
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-slate-400">
          Powered by{" "}
          <span className="font-semibold bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">
            Retenly
          </span>
        </div>
      </div>
    </div>
  );
}
