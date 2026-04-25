export const MOTIVATIONAL_QUOTES: { text: string; author: string }[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does — keep going.", author: "Sam Levenson" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "Physics is not a religion. If it were, we'd have a much easier time raising money.", author: "Leon Lederman" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Your only limit is your mind.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "It's going to be hard, but hard is not impossible.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Work hard in silence, let your success be your noise.", author: "Frank Ocean" },
  { text: "IIT is not a destination, it's a transformation.", author: "Unknown" },
  { text: "The pain of studying is temporary. The pride of achievement is permanent.", author: "Unknown" },
  { text: "One hour of focused practice beats five hours of passive reading.", author: "Unknown" },
  { text: "You are one practice session away from a breakthrough.", author: "Unknown" },
  { text: "JEE tests not just what you know, but how you think.", author: "Unknown" },
]

export function getDailyQuote(): { text: string; author: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length]
}
