# favorites-search-gallery

### Search, view, and play favorites all on one page

<li><a href="#about">About</a></li>
<li><a href="#getting-started">Getting Started</a></li>
<li><a href="#controls">Controls</a></li>
<li><a href="#features">Features</a></li>
<li><a href="#preferred-specs">Preferred Specs</a></li>
<li><a href="#faq">FAQ</a></li>

## About

I noticed [Favorites Search by MegaMoo77](https://github.com/MegaMoo77/favorites-search) stopped working some time ago\
 I couldn't find a suitable replacement, so I created my own

## Getting Started

<ol>
<li>Install the extension  or Tampermonkey script (not linked here for obvious reasons)</li>
<li>Go to any favorites page
    <ul>
    <li>Should look like: <strong>...</strong>/index.php?page=favorites&s=view&id=<strong>&ltID&gt</strong></li>
    </ul>
</li>
<li>Enjoy</li>
</ol>

## Controls

<ul>
    <li><strong>Left Click:</strong></li>
      <ul>
        <li><strong>On thumbnail:</strong> Show original content associated with thumbnail and enter gallery</li>
        <li><strong>In gallery:</strong> Exit gallery</li>
      </ul>
    <li>
      <strong>Middle Click:</strong>
      <ul>
          <li><strong>On thumbnail / In gallery:</strong> Open post page of thumbnail in new tab</li>
          <li><strong>Not on thumbnail:</strong> Show original content automatically when hovering over thumbnail (toggle)</li>
      </ul>
    </li>
    <li><strong>Scroll Wheel/Arrow Keys/WASD (in gallery):</strong> Traverse gallery</li>
    <li><strong>Scroll Wheel: (on thumbnail, not in gallery, hovering enabled):</strong> Change background opacity</li>
    <li><strong>Escape (in gallery):</strong> Exit gallery</li>
    <li><strong>Right Click (in gallery):</strong> Exit gallery, but enable enlarge on hover</li>
</ul>

## Features

<ol>
    <li>Search favorites with the the same syntax as the normal post pages (except for meta tags):<br>
        <strong>Includes:</strong>
            <ul>
            <li>AND, OR, NOT</li>
            <li>WILDCARD</li>
            <li>ID</li>
            </ul>
        <strong>Does not include:</strong> Meta tags like: rating, score, etc
        <br>
        <strong>Examples:</strong><br>
        <ul>
        <li>( video ~ animated ~ high_res* ~ absurd_res* ) -low_res* ( female* ~ 1girls ~ 123 ) -ai_generated -red_hair</li>
        <li>( 123 ~ 456 ~ 99999* ~ 1girls ) -video ( apple* ~ banana ~ pineapple )</li>
        </ul>
    </li><br>
    <li>View full resolution images and GIFs, or play videos when hovering over or clicking on a thumbnail + gallery controls<br>
        Gallery also works on post pages
    </li><br>
    <li>Only wait on fetching once.<br>
        Favorites are stored in a client database after fetching them for the first time<br>
        Allows for quick loading anytime later
    </li><br>
    <li>Save multiple custom searches to use later</li><br>
    <li>Shuffle search results order</li><br>
    <li>Invert search results</li><br>
    <li>Filtering of blacklisted tags</li><br>
    <li>Search favorites by their post ID</li><br>
    <li>Tooltip showing which tags and or groups matched any given thumbnail</li><br>
    <li>Choose full-screen image resolution</li><br>
    <li>Enlarged remove buttons that don't force page reloads</li><br>
    <li>Autocompleted tag search</li><br>
    <li>Look at other user's favorites with the above features (blacklisted tags are hidden automatically)</li><br>
</ol>

## Preferred Specs:

VRAM: 4GB\
Download Speed: 75Mb/s

## FAQ

Q: Why is there some bug/issue?\
A: If not already addressed below, [report the bug](https://github.com/bruh3396/favorites-search-gallery/issues) and explain how to reproduce it.

Q: Everything stopped working, why I can't see any favorites?\
A: Delete all site data (cookies, localStorage, indexedDB) through your browser's settings. Then retry.

Q: What browsers are supported?\
A: Chrome and Edge work. Firefox is currently disabled for now.

Q: Does it work on mobile?\
A: No.

Q: Why am I experiencing lag?\
A: Responsiveness depends on:

<ul>
    <li>Internet speed: A lot of network activity (loading favorites, rendering images, getting image extensions) happens in the background.</li>
    <li>Favorite count: >15000 favorites can start getting slow when they're all on one page. I plan to implement multiple pages in the future.</li>
</ul>

Q: Why do I sometimes see a black screen for a couple of seconds?\
A: Your GPU most cleared its memory after exceeding its limit as a result of you looking at images too quickly:

<ul>
    <li>The script stores full resolution images in VRAM rather than using image elements or file blobs.</li>
    <ul>
        <li>This improves responsiveness, but uses more video memory.</li>
    </ul>
    <li>The garbage collection will eventually free old renders
    <ul>
        <li>As long as you aren't rapidly moving through the gallery, you should be fine.</li>
    </ul>
</ul>
