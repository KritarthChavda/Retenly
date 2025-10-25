import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Twitter, Facebook, Instagram, ArrowLeft } from "lucide-react";
import thankYouImage from "@/assets/thank-you-celebration.png";
import Confetti from "./Confetti";

export default function ThankYouPage({
  onBack,
  restaurantName = "Downtown Rajkot",
  customerName = "friend",
  socialLinks = {},
}) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [shareUrl, setShareUrl] = useState(""); // avoid SSR window access

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  const shareText = `I just shared my amazing experience at ${restaurantName}! 🍽️✨`;

  const handleShare = (platform: string) => {
    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "native":
        if (navigator.share) {
          navigator.share({
            title: `Feedback for ${restaurantName}`,
            text: shareText,
            url: shareUrl,
          });
          return;
        }
        break;
    }
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          duration={3000}              // keep the canvas around for 3s
          onDone={() => setShowConfetti(false)} // then remove it
        />
      )}

      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Thank You Image */}
        <div className="flex justify-center mb-8">
          <img
            src={thankYouImage.src}
            alt="Thank you celebration"
            className="w-64 h-48 object-contain"
          />
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent selection:bg-pink-500/30 selection:text-white">
            Thank You, {customerName}! 🎉
          </h1>
          <p className="text-xl text-slate-300">
            Your feedback means the world to us at{" "}
            <span className="font-semibold text-white">{restaurantName}</span>
          </p>
        </div>

        {/* Success Card */}
        <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-lg backdrop-blur-sm p-8">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl">✨</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Feedback Received!</h2>
              <p className="text-slate-300">
                We've received your valuable feedback and our team will review it to make your next visit even better.
              </p>
            </div>

            {/* What's Next */}
            <div className="bg-slate-700/30 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-lg text-white">What happens next?</h3>
              <ul className="text-sm text-slate-300 space-y-2 text-left">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-400">•</span>
                  <span>Our team will review your feedback within 24 hours</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-400">•</span>
                  <span>If you provided contact info, we may reach out to follow up</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-400">•</span>
                  <span>Your insights help us improve for all our guests</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Social Sharing */}
        <div className="space-y-4 animate-pulse" style={{ animationDelay: "0.6s" }}>
          <h3 className="text-lg font-semibold text-white">Share Your Experience</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare("native")}
              className="flex items-center space-x-2 hover:bg-slate-700"
              // disabled={!shareUrl}
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare("twitter")}
              className="flex items-center space-x-2 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-400"
              // disabled={!shareUrl}
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare("facebook")}
              className="flex items-center space-x-2 hover:bg-blue-600/10 hover:text-blue-500 hover:border-blue-500"
              // disabled={!shareUrl}
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </Button>

            {socialLinks.instagram && (
            <Button
              variant="outline"
              size="sm"
                asChild
                className="flex items-center space-x-2 hover:bg-pink-500/10 hover:text-pink-400 hover:border-pink-400"
            >
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
              <Instagram className="w-4 h-4" />
                  <span>Follow Us</span>
                </a>
            </Button>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="pt-8">
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
        <div className="text-center pt-8 text-sm text-slate-400">
          Powered by{" "}
          <span className="font-semibold bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">Retenly</span>
        </div>
      </div>
    </div>
  );
}
