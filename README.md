# favorites-search-gallery
Favorites Search + Gallery
https://github.com/bruh3396/favorites-search-gallery

## Controls
    Left Click (Toggle) on thumbnail: Toggle gallery
    Middle Click:
        Not hovering hover thumbnail: Toggle content automatically enlarging when hovering over thumbnails
        Hovering over thumbnail/In gallery: Open post page of thumbnail in new tab

    Scroll Wheel/Arrow Keys/WASD: Move to next/previous image in gallery
    Escape: Exit gallery

## Features
  1. Search favorites with the exact same syntax as the normal post pages: AND, OR, and NOT combinations (except for meta tags like rating:, score:, etc.).
  Example search:
      ( video ~ animated ~ high_res* ~ absurd_res* ) -low_res* ( female* ~ 1girls ) -ai_generated -red_hair

  2. View full resolution images and gifs, or play videos when hovering over or clicking on a thumbnail + gallery controls.
      Gallery also works on post pages.

  3. Only wait on fetching once.
      Favorites are stored in a client database after fetching them for the first time.
      Allows for near instant loading on later page reloads.

  4. Save multiple custom searches to use later.
  5. Shuffle search results order.
  6. Invert search results.
  6. Toggle filtering of blacklisted tags.
  8. Search favorites by their post ID.
  9. Tooltip showing which tags and or groups matched any given thumbnail.
  10. Choose fullscreen image resolution.
  11. Look at other user's favorites with the above features (blacklisted images are hidden automatically).
  12. Enlarged remove buttons that don't force page reloads.
  13. Autocompleted search.

## Screenshots / GIFs

## Installation

## Preffered Spec Requirements:
    VRAM: 4GB
    Internet Download Speed: 75Mb/s

## FAQ
    Q: Why is there some bug?
    A: If not already addressed below, contact me with the bug and explain how to reproduce it.

    Q: Everything stopped working, why I can't see any favorites?
    A: Delete all site data (cookies, localStorage, indexedDB) through your browser's settings. Then retry.

    Q: What browsers are supported?
    A: I've only tested Chrome and Edge for now. Firefox is currently disabled.

    Q: Does it work on mobile?
    A: No.

    Q: Why is everything laggy?
    A: Responsiveness depends on:
        1. Internet speed: A lot of network request (loading favorites, rendering images, getting image extensions) occur in the background.
        2. Favorite count: >15000 favorites can start getting slow when they're all on one page. I plan to implement multiple pages or lazy loading in the future.

    Q: Why do I sometimes see a black screen for a couple of seconds?
    A: Your GPU most cleared its memory after exceeding its limit as a result of you looking at images too quickly.
    The script stores full resolution images as offscreen canvases in VRAM rather than using <img> elements or object URLs.
    This improves responsiveness, but uses more video memory.
    The garbage collection will eventually free old renders, so as long as you aren't rapidly traversing through the gallery, you should be fine.