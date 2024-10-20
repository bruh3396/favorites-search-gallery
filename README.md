# favorites-search-gallery

[About](#about)<br>
[Getting Started](#getting-started)<br>
[Features](#features)<br>
[Preferred Specs](#preferred-specs)<br>
[Controls](#controls)<br>
[FAQ](#faq)

## About

[Favorites Search by MegaMoo77](https://github.com/MegaMoo77/favorites-search) stopped working some time ago<br>
I couldn't find a suitable replacement, so I created my own adaptation including a gallery and some QOL [features](#features)<br>
This script is still in development, please let me know if you experience a bug, or have a question/feature request

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

## Features

<ul>
    <li>Search favorites with the the same syntax as the normal post pages (except for meta tags):<br>
        <strong>Includes:</strong>
            <ul>
            <li>AND, OR, NOT</li>
            <li>WILDCARD (starts with)</li>
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
    <li>Add custom or existing tags to favorites</li>
        <ul>
            <li>Allows for complex tags and grouping (essentially folders)</li>
            <li>Does not actually add tags to the post associated with a favorite (all changes are local)</li>
            <li>Original tags of favorite cannot be altered</li>
        </ul>
    <li>Save custom searches</li>
    <li>Enlarged remove buttons that don't force page reloads</li>
    <li>Shuffle search results</li>
    <li>Invert search results</li>
    <li>Exclude results with blacklisted tags</li>
    <li>Search by post ID</li>
    <li>See tooltip showing which tags were matched by the last search</li>
    <li>Clickable overlay of character, copyright, and artist tags related to thumbnail</li>
    <li>Choose full-screen image resolution</li>
    <li>Autocompleted tag search</li>
    <li>Look at other user's favorites with the above features (blacklisted tags are hidden automatically)</li>
    <li>Sort by score, width, height, rating, id, date uploaded, or date changed</li>
    <li>Filter by rating: safe, questionable, explicit, or any combination of the three</li>
</ul>

## Preferred Specs:

Memory: 8GB<br>
Video Memory: 4GB<br>
Download Speed: 75Mb/s<br>

## Controls
### General Controls
| Input | Function | Condition |
| :-------- | :-------- | :-------- |
| Left Click, Touch | Enlarge thumbnail content and enter gallery | Clicked on a thumbnail |
| Middle Click | Open post page of thumbnail in new tab | Clicked on a thumbnail |
| Middle Click | Toggle "Enlarge on Hover" option | Did **NOT** click on a thumbnail |
| Scroll Wheel | Change background opacity | Hovering over thumbnail with "Enlarge on Hover" enabled |

### Gallery Controls
| Input | Function | Condition |
| :-------- | :-------- | :-------- |
| Arrow Keys, Scroll Wheel, WASD, Swipe  | Traverse gallery | |
| Left Click, Touch, Escape | Exit gallery | Content is not a video |
| Right Click | Exit gallery, Enable "Enlarge on Hover" option | |
| Middle Click | Open post page of thumbnail in new tab | |

### Extra Gallery Hotkeys

| Key | Function | Condition |
| :-------- | :-------- | :-------- |
| F | Add favorite | **NOT** on your own favorite page |
| X | Remove favorite | "Remove Button" option checked |
| M | Toggle video mute |  |
| B | Toggle background |  |


## FAQ

Q: Why is there some bug/issue?<br>
A: If not already addressed below, [report the bug](https://github.com/bruh3396/favorites-search-gallery/issues) and explain how to reproduce it.

Q: Everything stopped working, why I can't see any favorites?<br>
A: Click the "Reset" button and reload.<br><br>
If that doesn't work, delete all site data (cookies, localStorage, indexedDB) through your browser's settings.
<br> If that also doesn't work, [report the bug](https://github.com/bruh3396/favorites-search-gallery/issues) and explain how to reproduce it.

Q: What browsers are supported?<br>
A: Chrome, Edge, and Firefox are supported.

Q: Does it work on mobile/Android/iOS?<br>
A: Yes, but only search  and gallery are enabled. Tooltips and captions are disabled to improve performance.<br>
- Requires a mobile browser that supports Tampermonkey or Userscripts
  - Firefox on Android.
  - [Userscripts](https://github.com/quoid/userscripts) on iOS.
- Still a new feature and somewhat laggy. I plan to optimize it further.
- Has an option to disable gallery on lower performance devices.

Q: Why am I experiencing lag?<br>
A: Responsiveness depends on:
- Internet speed:
  - A lot of network activity (loading favorites, rendering images) happens in the background.
  - A stable wired connection is preferred.
- Improve responsiveness and performance by:
  - Reducing the "Results per Page" option.
  - Lowering the "Performance Profile" option.
