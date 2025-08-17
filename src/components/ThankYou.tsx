/**
 * Thank you component displayed after successful feedback submission
 * 
 * @returns JSX element containing the thank you message
 */
export default function ThankYou() {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-yellow-400">
          Thank you so much! 🎉
        </h2>
        <p className="text-gray-300 text-lg">
          Your feedback means the world to us! We're already working on making your next visit even better.
        </p>
      </div>
      
      <div className="flex justify-center">
        <div className="bg-gray-800 rounded-lg p-6 max-w-sm">
          <div className="text-6xl mb-4">🎭</div>
          <p className="text-gray-300 text-sm">
            &quot;Thanks for the feedback! We&apos;re always listening and improving.&quot;
          </p>
        </div>
      </div>
      
      <div className="pt-6">
        <p className="text-gray-400 text-sm">
          Come back soon for more delicious experiences! ❤️
        </p>
      </div>
    </div>
  )
} 