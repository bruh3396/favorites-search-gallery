# favorites-search-gallery

[About](#about)<br>
[Getting Started](#getting-started)<br>
[Features](#features)<br>
[Preferred Specs](#preferred-specs)<br>
[Controls](#controls)<br>
[Hotkeys](#hotkeys)<br>
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
</ul>

## Preferred Specs:

Memory: 8GB<br>
Video Memory: 4GB<br>
Download Speed: 75Mb/s<br>

## Controls
<strong>Left Click/Touch:</strong>
<ul>
<li><strong>On thumbnail:</strong> Show original content associated with thumbnail and enter gallery</li>
<li><strong>In gallery:</strong> Exit gallery</li>
</ul><br>
<strong>Middle Click:</strong>
<ul>
<li><strong>On thumbnail / In gallery:</strong> Open post page of thumbnail in new tab</li>
<li><strong>Not on thumbnail:</strong> Show original content automatically when hovering over thumbnail (toggle)</li>
</ul><br>
<strong>Scroll Wheel/Arrow Keys/WASD/Swipe Left or Right (in gallery):</strong> Traverse gallery<br><br>
<strong>Scroll Wheel (on thumbnail, not in gallery, hovering enabled):</strong> Change background opacity<br><br>
<strong>Escape/Swipe Up (in gallery):</strong> Exit gallery<br><br>
<strong>Right Click (in gallery):</strong> Exit gallery, but enable enlarge on hover

## Hotkeys

## FAQ

Q: Why is there some bug/issue?<br>
A: If not already addressed below, [report the bug](https://github.com/bruh3396/favorites-search-gallery/issues) and explain how to reproduce it.

Q: Everything stopped working, why I can't see any favorites?<br>
A: Click the "Reset" button and reload.<br>If that doesn't work, delete all site data (cookies, localStorage, indexedDB) through your browser's settings.<br> If that also doesn't work, [report the bug](https://github.com/bruh3396/favorites-search-gallery/issues) and explain how to reproduce it.

Q: What browsers are supported?<br>
A: Chrome, Edge, and Firefox are supported.

Q: Does it work on mobile/Android/iOS?<br>
A: Yes, but only search  and gallery are enabled. Tooltips and captions are disabled to improve performance.<br>
<ul>
    <li>Requires a mobile browser that supports Tampermonkey or Userscripts</li>
    <ul>
        <li>Firefox on Android.</li>
        <li> <a href="https://github.com/quoid/userscripts">Userscripts</a> on iOS.</li>
    </ul>
    <li>Still a new feature and somewhat laggy. I plan to optimize it further.</li>
    <li>Has an option to disable gallery on lower performance devices.</li>
</ul>

Q: Why am I experiencing lag?<br>
A: Responsiveness depends on:
<ul>
    <li>Internet speed: </li>
    <ul>
        <li>A lot of network activity (loading favorites, rendering images) happens in the background.</li>
        <li>A stable wired connection is preferred.</li>
    </ul>
    <li> Improve responsiveness and performance by:</li>
    <ul>
     <li>Reducing the "Results per Page" option.</li>
     <li>Lowering the "Performance Profile" option.</li>
    </ul>
</ul>
