# favorites-search-gallery

[About](#about)<br>
[Getting Started](#getting-started)<br>
[Features](#features)<br>
[Recommended Specs](#recommended-specs)<br>
[Controls](#controls)<br>
[Search Syntax](#search-syntax)<br>
[FAQ](#faq)
[Credits](#credits)<br>

## About

[Favorites Search by MegaMoo77](https://github.com/MegaMoo77/favorites-search) stopped working some time ago<br>
I couldn't find a suitable replacement, so I created my own adaptation including a gallery and many QOL [features](#features)<br>
This script is still in development, please let me know if you experience a bug, or have a question/feature request

## Getting Started

### Desktop
* Install Tampermonkey in any browser
* If using Chrome/Edge, enable "Developer Mode" in your browser
  * Extensions > Manage Extensions > Developer Mode
* Install this script using Tampermonkey
* Go to any favorites page, it should end with: **index.php?page=favorites&s=view&id=<span style="color:blue">\<ID\></span>**

### Mobile iOS
* Install "Userscripts" on the Apple App Store
* Enable Userscripts in Safari
  * Settings > Apps > Safari > Extensions > Userscripts > Allow Extension & Allow in Private Browsing
* On Tampermonkey in Safari, click green "Install this script" button
  * Click "I already have a user script manager..."
  * Click extension icon in Safari's address bar
  * Click "Userscripts" > "Tap to Install"
  * Scroll down, click "Install"
* Go to any favorites page, it should end with: **index.php?page=favorites&s=view&id=<span style="color:blue">\<ID\></span>**

### Mobile Android
* Install Firefox on the Google Play Store
* Install Tampermonkey Extension and enable it in Firefox
* Click green "Install this script" button
* Go to any favorites page, it should end with: **index.php?page=favorites&s=view&id=<span style="color:blue">\<ID\></span>**

## Features

* Search favorites with the the same [syntax](#search-syntax) as the normal search pages (including meta tags):
* View full resolution images, or play videos and GIFs in a gallery (also works on search pages)
* Autocompleted tag search
* Remove favorites without reloading page
* Add favorites from other users' favorites pages
* Only wait on fetching once
  * Favorites are stored in a client database after fetching them for the first time
  * Allows for quick loading anytime later
* Add custom or existing tags to favorites
    * Allows for complex tags and grouping (essentially folders)
    * Does not actually add tags to the post associated with a favorite (all changes are local)
    * Original tags of favorite cannot be altered
* Save custom searches
* Shuffle search results
* Invert search results
* Exclude results with blacklisted tags
* Search by post ID
* See tooltip showing which tags were matched by the last search
* Click overlay of tags related to favorite to add them to the search box
* Look at other user's favorites with the above features (blacklisted tags are automatically hidden)
* Sort by score, width, height, rating, id, date uploaded, or date changed
* Filter by rating: safe, questionable, explicit, or any combination of the three
* Add/Remove favorites while in gallery
* Redirect to original images in new tabs

## Recommended Specs:
| Metric | Recommended |
| :-------- | :-------- |
| Memory | 8GB |
| Video Memory | 4GB |
| Download Speed | 75Mb/s |

## Controls
### General Controls (Desktop)
| Input | Function | Condition |
| :-------- | :-------- | :-------- |
| Left Click | Enlarge thumbnail content and enter gallery | Clicked on a thumbnail |
| Middle Click | Open post page of thumbnail in new tab | Clicked on a thumbnail |
| Ctrl Left Click | Open original content in new tab and stay on current tab | Clicked on a thumbnail |
| Ctrl Shift Left Click | Open original content in new tab and move to new tab | Clicked on a thumbnail |
| Middle Click | Toggle "Enlarge on Hover" option | Did **NOT** click on a thumbnail or tag in details |
| Scroll Wheel | Change background opacity | Cursor hovering over thumbnail with "Enlarge on Hover" enabled |
| Shift + Scroll Wheel | Change column count | |
| Left Click | Add tag to search | Clicked on a tag in details |
| Right Click | Add negated tag to search | Clicked on a tag in details |
| Middle Click | Quick search tag | Clicked on a tag in details |
| Ctrl Left Click | Search site for tag in new tab | Clicked on a tag in details |
| Right Click | Search site for current query in new tab | Clicked on "Search" button |
| Ctrl Click | Search site for current query in new tab, stay on current tab | Clicked on "Search" button |

### General Controls (Mobile)
| Input | Function | Condition |
| :-------- | :-------- | :-------- |
| Touch | Enlarge thumbnail content and enter gallery | Clicked on a thumbnail and gallery enabled |
| Touch | Open thumbnail post in new page | Clicked on a thumbnail and gallery disabled |


### Gallery Controls (Desktop)
| Input                                 | Function                                       | Condition              |
| :-------------------------------------| :----------------------------------------------| :----------------------|
| Arrow Keys, Scroll Wheel, AD   | Traverse gallery                               |                        |
| Escape                                |    Exit gallery                                |                        |
| Right Click                           | Exit gallery |                        |
| Middle Click                          | Open post in new tab         |                        |
| Double Left Click                          | Exit gallery         | Content is a video                       |
| Ctrl Left  Click                          | Open original content in new tab and stay on current tab         |                        |
| Ctrl Shift Left Click | Open original content in new tab and move to new tab |  |

### Gallery Controls (Mobile)
| Input                                 | Function                                       | Condition              |
| :-------------------------------------| :----------------------------------------------| :----------------------|
| Tap Left/Right Edge of Screen    | Traverse gallery                               |                        |
| Swipe Down                       | Exit gallery                                   |  |
| Swipe Up                       | Show autoplay menu                                   |  |

### Gallery Hotkeys (Desktop)

| Key | Function                       | Condition                          |
|-----|--------------------------------|------------------------------------|
| E   | Add favorite                   |                                    |
| X   | Remove favorite                | "Remove Buttons" option checked     |
| M   | Toggle video mute              |                                    |
| B   | Toggle background              |                                    |
| P   | Stop/start autoplay            | Autoplay option checked            |
| F   | Toggle fullscreen            |             |
| Q   | Open original content in new tab            |             |
| G   | Open post in new tab            |             |




### General Hotkeys (Desktop)

| Key | Function        |
| :---| :---------------|
| T   | Toggle tooltips |
| D   | Toggle details  |
| U   | Toggle UI |
| O   | Toggle more options  |
| R   | Toggle add/remove favorite buttons |
| H   | Toggle hints |
| S   | Focus search box |


## Search Syntax

### Basic

Same as the normal site syntax with addition of lone "ID" without ":"

| Operator        | Syntax          | Example                                                                                                                |
|-----------------|-----------------|------------------------------------------------------------------------------------------------------------------------|
| And             | tag1 tag2       | apple banana grape                                                                                                     |
| Or              | ( tag1 ~ tag2 ) | ( apple ~ banana ~ grape )                                                                                             |
| Not             | -tag1           | -pineapple -orange                                                                                                     |
| Wildcard        | ta*1            | a\*ple\*auce b\*a\*n\*a \*grape\*                 |
| ID              | \<id\>          | 12345 55555                                                                                                            |
| Any Combination |                 | ( fruit ~ vegetable ~ a\*sauce ) \*apple\* -apple\* -banana -grape\* -lemon\* ( ripe ~ tasty\* ) -12345 -55555 -112234 |



### Wildcard Examples

Same as the normal site except "\*tag" (aka "ends with") works here, but does not work on the site

| Query                       | Explanation                                                                          |
|-----------------------------|--------------------------------------------------------------------------------------|
| apple\*                     | **starts** with "apple"                                                              |
| \*apple                     | **ends** with "apple"                                                                |
| \*apple\* -\*apple -apple\* | **contains** "apple", but does ***NOT*** **start** or **end** with "apple"           |
| a\*sauce                    | **starts** with "a" and **ends** with "sauce"                                        |
| pi\*ea\*ple                 | **starts** with "pi", **contains** "ea" in the middle, and **ends** with "ple"       |

### Meta

Same as the normal site except relative comparisons like "height:>width" work here, but do not work on the site<br>

| Operator     | Syntax | Example     |
|--------------|--------|-------------|
| Equals       | :      | width:1920  |
| Greater than | :>     | score:>50   |
| Less than    | :<     | id:<9999999 |


Supported:
 * score
 * width
 * height
 * id

Notes:
  *  "123" and "id:123" are equivalent
  * Score requires reset to update, but will update daily in the future (*WIP)

### Meta Examples

| Query                                            | Explanation                                                                                            |
|--------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| ( score:<10 ~ score:100 ~ score:>10000 ~ apple ) | score is **less** than 10, or score **equals** 100, or score is **greater** than 1000, or is an apple  |
| width:1920 height:1080 -video -animated          | HD image                                                                                               |
| height:>width video                              | portrait video                                                                                         |
| -height:>width video                             | landscape video                                                                                        |




### Realistic Examples

* ( video ~ animated ~ high_res\* ~ absurd_res\* ) -low_res\* ( female\* ~ 1girls ~ 123 ) -ai_generated -red_hair -no_sound looking_at_viewer score:>100
* ( fortnite\* ~ valorant\* ~ apex\* ~ \*league\* ) -video -\*animated\* -ai_generated \*3d\* -\*2d\*


## FAQ

Q: Why is there some bug/issue?
<br>
**A: If not already addressed below, [report the bug](https://github.com/bruh3396/favorites-search-gallery/issues) and explain how to reproduce it.**

Q: Everything stopped working, why I can't see any favorites?<br>
**A: Click the "Reset" button and reload.**
* If that doesn't work, delete all site data (cookies, localStorage, indexedDB) through your browser's settings.
* If that also doesn't work, [report the bug](https://github.com/bruh3396/favorites-search-gallery/issues) and explain how to reproduce it.

Q: What browsers are supported?
<br>
**A: Chrome, Edge, and Firefox are supported.**

Q: Does it work on mobile/Android/iOS?<br>
**A: Yes**<br>
* Requires a mobile browser that supports Tampermonkey or Userscripts
  * Firefox on Android.
  * [Userscripts](https://github.com/quoid/userscripts) on iOS.
* Has an option to disable gallery on lower performance devices.

Q: Why am I experiencing lag?<br>
**A: Responsiveness depends on:**
* Internet speed:
  * A lot of network activity (loading favorites, rendering images) happens in the background.
  * A stable wired connection is preferred.
* Improve responsiveness and performance by:
  * Reducing the "Results per Page" option.
  * Lowering the "Performance Profile" option.

## Credits

**Awesomplete**: An ultra-lightweight, customizable, simple autocomplete widget with zero dependencies, by Lea Verou. [Website](https://leaverou.github.io/awesomplete/) | [GitHub Repository](https://github.com/LeaVerou/awesomplete)
