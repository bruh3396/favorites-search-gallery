# favorites-search-gallery

<a href="#about">About</a>\
<a href="#getting-started">Getting Started</a>\
<a href="#controls">Controls</a>\
<a href="#features">Features</a>\
<a href="#preferred-specs">Preferred Specs</a>\
<a href="#faq">FAQ</a>

## About

[Favorites Search by MegaMoo77](https://github.com/MegaMoo77/favorites-search) stopped working some time ago\
I couldn't find a suitable replacement, so I created my own adaptation including a gallery and QOL features

## Getting Started

<ul>
    <li>Install Tampermonkey</li>
    <li>Install this script using Tampermonkey</li>
    <li>Go to any favorites page
        <ul>
        <li>Should end with: <strong>index.php?page=favorites&s=view&id=<font color ="blue">&ltID&gt</font></strong></li>
        </ul>
    </li>
<li>Enjoy</li>
</ul>

## Controls

<strong>Left Click:</strong>
    <ul>
    <li><strong>On thumbnail:</strong> Show original content associated with thumbnail and enter gallery</li>
    <li><strong>In gallery:</strong> Exit gallery</li>
    </ul><br>
    <strong>Middle Click:</strong>
    <ul>
        <li><strong>On thumbnail / In gallery:</strong> Open post page of thumbnail in new tab</li>
        <li><strong>Not on thumbnail:</strong> Show original content automatically when hovering over thumbnail (toggle)</li>
    </ul><br>
<strong>Scroll Wheel/Arrow Keys/WASD (in gallery):</strong> Traverse gallery<br><br>
<strong>Scroll Wheel: (on thumbnail, not in gallery, hovering enabled):</strong> Change background opacity<br><br>
<strong>Escape (in gallery):</strong> Exit gallery<br><br>
<strong>Right Click (in gallery):</strong> Exit gallery, but enable enlarge on hover

## Features

<ul>
    <li>Search favorites with the the same syntax as the normal post pages (except for meta tags):<br>
        <strong>Includes:</strong>
            <ul>
            <li>AND, OR, NOT</li>
            <li>WILDCARD</li>
            <li>ID</li>
            </ul>
        <strong>Does not include:</strong>
        <ul>
            <li>score:</li>
            <li>rating:</li>
            <li>user:</li>
            <li>height:</li>
            <li>width:</li>
            <li>parent:</li>
            <li>source:</li>
            <li>updated:</li>
        </ul>
        <br>
        <strong>Examples:</strong><br>
        <ul>
        <li>( video ~ animated ~ high_res* ~ absurd_res* ) -low_res* ( female* ~ 1girls ~ 123 ) -ai_generated -red_hair</li>
        <li>( 123 ~ 456 ~ 99999* ~ pear ) -grape* ( apple* ~ banana ~ pineapple ) -orange -cherry</li>
        </ul>
    </li>
    <li>View full resolution images, or play videos and GIFs ( also works on post pages )
    </li>
    <li>Only wait on fetching once.<br>
    <ul>
        <li>Favorites are stored in a client database after fetching them for the first time</li>
        <li>Allows for quick loading anytime later</li>
    </ul>
    </li>
    <li>Save custom searches</li>
    <li>Shuffle search results</li>
    <li>Invert search results</li>
    <li>Exclude results with blacklisted tags</li>
    <li>Search by post ID</li>
    <li>See tooltip showing which tags were matched by the last search</li>
    <li>Clickable overlay of character, copyright, and artist tags related to thumbnail</li>
    <li>Choose full-screen image resolution</li>
    <li>Enlarged remove buttons that don't force page reloads</li>
    <li>Autocompleted tag search</li>
    <li>Look at other user's favorites with the above features (blacklisted tags are hidden automatically)</li>
</ul>

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
A: Your GPU most likely cleared its memory after exceeding its limit as a result of you looking at images too quickly:

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
