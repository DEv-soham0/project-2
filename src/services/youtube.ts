// YouTube API integration for fetching comments
// Note: For a production app, you would need to set up a proper YouTube API key
// and handle authentication. This is a simplified version for demonstration.

// API key - in production this should be in an environment variable
const API_KEY = "AIzaSyAgCqWHY9-nU233701W-KXKo1PxdEnMQTU";

export interface YouTubeComment {
  id: string;
  text: string;
  author: string;
  publishedAt: string;
  likeCount: number;
}

/**
 * Extract video ID from a YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

interface YouTubeApiResponse {
  items: Array<{
    id: string;
    snippet: {
      topLevelComment: {
        snippet: {
          authorDisplayName: string;
          textDisplay: string;
          publishedAt: string;
          likeCount: number;
        }
      }
    }
  }>;
  nextPageToken?: string;
}

/**
 * Fetch comments from a YouTube video using the YouTube Data API v3
 */
export async function fetchYouTubeComments(videoId: string, maxResults: number = 100): Promise<YouTubeComment[]> {
  try {
    let comments: YouTubeComment[] = [];
    let nextPageToken: string | undefined = undefined;
    
    do {
      const params = new URLSearchParams({
        part: 'snippet',
        videoId: videoId,
        maxResults: maxResults.toString(),
        textFormat: 'plainText',
        key: API_KEY
      });
      
      if (nextPageToken) {
        params.append('pageToken', nextPageToken);
      }
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }
      
      const data: YouTubeApiResponse = await response.json();
      
      const newComments = data.items.map(item => ({
        id: item.id,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        likeCount: item.snippet.topLevelComment.snippet.likeCount
      }));
      
      comments = [...comments, ...newComments];
      nextPageToken = data.nextPageToken;
      
    } while (nextPageToken && comments.length < maxResults);
    
    return comments;
    
  } catch (error) {
    console.error('Error fetching YouTube comments:', error);
    throw error;
  }
} 