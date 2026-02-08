"""
Reddit scraper for fetching real health-related patient cases.
Uses PRAW (Python Reddit API Wrapper) for official Reddit API access.
"""

import logging
import praw
from typing import List, Dict, Any, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RedditScraper:
    """
    Scrapes health-related posts from Reddit to generate realistic patient cases.
    """

    def __init__(self):
        """Initialize Reddit API client."""
        # Note: Requires Reddit API credentials (client_id, client_secret, user_agent)
        # These should be in environment variables
        self.client_id = settings.reddit_client_id if hasattr(settings, 'reddit_client_id') else None
        self.client_secret = settings.reddit_client_secret if hasattr(settings, 'reddit_client_secret') else None
        self.user_agent = "MedStudentPro/1.0 (Medical Education)"

        if self.client_id and self.client_secret:
            try:
                self.reddit = praw.Reddit(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    user_agent=self.user_agent
                )
                logger.info("✅ Reddit API client initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Reddit client: {e}")
                self.reddit = None
        else:
            logger.warning("⚠️ Reddit API credentials not configured")
            self.reddit = None

    async def fetch_health_posts(
        self,
        subreddits: List[str] = None,
        limit: int = 10,
        time_filter: str = "month"
    ) -> List[Dict[str, Any]]:
        """
        Fetch health-related posts from Reddit subreddits.

        Args:
            subreddits: List of subreddit names to scrape
            limit: Maximum number of posts to fetch
            time_filter: Time period (hour, day, week, month, year, all)

        Returns:
            List of post data dictionaries
        """
        if not self.reddit:
            logger.error("Reddit client not initialized")
            return []

        if not subreddits:
            subreddits = [
                "AskDocs",
                "Health",
                "medical",
                "HealthAnxiety",
                "Medicine",
                "Symptoms",
            ]

        posts = []

        try:
            for subreddit_name in subreddits:
                logger.info(f"🔍 Scraping r/{subreddit_name}...")

                try:
                    subreddit = self.reddit.subreddit(subreddit_name)

                    # Get top posts from time period
                    for post in subreddit.top(time_filter=time_filter, limit=limit):
                        # Skip stickied posts and low quality content
                        if post.stickied or post.score < 5:
                            continue

                        post_data = {
                            "id": post.id,
                            "title": post.title,
                            "body": post.selftext,
                            "author": post.author.name if post.author else "[deleted]",
                            "score": post.score,
                            "subreddit": subreddit_name,
                            "url": post.url,
                            "created_utc": post.created_utc,
                            "num_comments": post.num_comments,
                        }
                        posts.append(post_data)

                        if len(posts) >= limit:
                            break

                except Exception as e:
                    logger.error(f"❌ Error scraping r/{subreddit_name}: {e}")
                    continue

                if len(posts) >= limit:
                    break

            logger.info(f"✅ Fetched {len(posts)} posts from Reddit")
            return posts

        except Exception as e:
            logger.error(f"❌ Error fetching posts: {e}")
            return []

    async def get_post_comments(self, post_id: str, limit: int = 5) -> List[Dict[str, str]]:
        """
        Fetch top comments from a post for additional context.

        Args:
            post_id: Reddit post ID
            limit: Max comments to fetch

        Returns:
            List of comment data
        """
        if not self.reddit:
            return []

        try:
            post = self.reddit.submission(id=post_id)
            post.comments.replace_more(limit=0)

            comments = []
            for comment in post.comments[:limit]:
                comments.append({
                    "author": comment.author.name if comment.author else "[deleted]",
                    "body": comment.body,
                    "score": comment.score,
                })

            return comments

        except Exception as e:
            logger.error(f"Error fetching comments for {post_id}: {e}")
            return []


# Initialize scraper
reddit_scraper = RedditScraper()
