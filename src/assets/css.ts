export const CAPTION_CSS = `
  .caption {
    overflow: hidden;
    pointer-events: none;
    background: rgba(0, 0, 0, .75);
    z-index: 15;
    position: absolute;
    width: 100%;
    height: 100%;
    top: -100%;
    left: 0px;
    top: 0px;
    text-align: left;
    transform: translateX(-100%);
    /* transition: transform .3s cubic-bezier(.26,.28,.2,.82); */
    transition: transform .35s ease;
    padding-top: 0.5ch;
    padding-left: 7px;

    h6 {
      display: block;
      color: white;
      padding-top: 0px;
    }

    li {
      width: fit-content;
      list-style-type: none;
      display: inline-block;
    }

    &.active {
      transform: translateX(0%);
    }

    &.transition-completed {
      .caption-tag {
        pointer-events: all;
      }
    }
  }

  .caption.hide {
    display: none;
  }

  .caption.inactive {
    display: none;
  }

  .caption-tag {
    pointer-events: none;
    color: #6cb0ff;
    word-wrap: break-word;

    &:hover {
      text-decoration-line: underline;
      cursor: pointer;
    }
  }

  .artist-tag {
    color: #f0a0a0;
  }

  .character-tag {
    color: #f0f0a0;
  }

  .copyright-tag {
    color: #EFA1CF;
  }

  .metadata-tag {
    color: #8FD9ED;
  }

  .caption-wrapper {
    pointer-events: none;
    position: absolute !important;
    overflow: hidden;
    top: -1px;
    left: -1px;
    width: 102%;
    height: 102%;
    display: block !important;
  }
`;
export const DESKTOP_CSS = `
  .checkbox {
    cursor: pointer;

    &:hover {
      color: #000;
      background: #93b393;
      text-shadow: none;
    }

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
    }
  }

  #sort-ascending-checkbox {
    width: 20px;
    height: 20px;
  }

  #favorites-pagination-container>button {
    height: 35px;
  }

  .gallery-menu-button {
    &:hover {
      opacity: 1;
      transform: scale(1.25);
    }
  }

  .gallery-menu-button::after {
    content: attr(data-hint);
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    background: black;
    padding: 2px 6px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    font-size: larger;
    transition: opacity 0.35s ease-in-out;
    border-radius: 3px;
    pointer-events: none;
  }

  .gallery-menu-button:hover::after {
    opacity: 1;
    visibility: visible;
  }

  #bottom-panel-4 {
    flex: 0 0 15% !important;
  }
`;
export const DESKTOP_SIDEBAR_CSS = `
  #tag-modifier-option-container,
  #tag-modifier-ui-container,
  #show-ui-label,
  #show-saved-searches-container,
  #right-favorites-panel,
  #help-links-container,
  #search-header,
  #goto-page-container {
    display: none !important;
  }

  #favorites-search-gallery {
    display: flex;
  }

  #left-favorites-panel-bottom-row {
    flex-direction: column;
  }

  #left-favorites-panel-top-row {
    display: flex;
    flex-direction: column;

    .awesomplete {
      order: 3;
    }
  }

  #favorites-search-box {
    order: 3;
  }

  #favorites-search-gallery-menu {
    flex: 0 0 10%;
    align-self: flex-start;
    background: transparent;
    margin-top: -5px;
  }

  .checkbox {
    height: 24px;
  }

  #favorites-main-buttons-container {
    order: 2;
  }

  #favorites-search-gallery-content {
    margin-top: 20px;
  }

  #favorites-pagination-container {
    text-align: center;
    margin-bottom: 5px;

    >button {
      font-size: 10px;
      margin: 0px 1px;
      padding: 0;
    }
  }

  #favorites-search-gallery-content {
    width: 100%;
  }
`;
export const DESKTOP_SLIM_CSS = `
  #search-header,
  #help-links-container,
  #site-title {
    display: none !important;
  }

  #favorites-pagination-container>button,
  #goto-page-input,
  #goto-page-button,
  #favorites-main-buttons-container>button {
    height: 25px !important;
    border-radius: 0 !important;
  }
`;
export const GALLERY_CSS = `
  html {
    width: 100vw;
  }

  body {
    overflow-x: hidden;
  }

  video::-webkit-media-controls-panel {
    background: transparent !important;
  }

  video::-webkit-media-controls-enclosure {
    background: transparent !important;
  }

  #gallery-container {
    pointer-events: none;
    z-index: 9000;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;

    * {
      top: 0;
      left: 0;
      position: fixed;
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
    }
  }

  .fullscreen-image-container {
    width: 100%;
    height: 100%;
    pointer-events: none;
    position: relative;



    &.zoomed-in {
      overflow: scroll;
      pointer-events: all;

      &.zooming {
        cursor: zoom-out;
      }

      .fullscreen-image {
        height: 250%;
        left: 0 !important;
        top: 0 !important;
        transform: none !important;
      }
    }
  }

  .fullscreen-image {
    position: relative !important;
    pointer-events: none;
    height: 100%;
    margin: 0;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%);
  }

  a.hide {
    cursor: default;
  }

  option {
    font-size: 15px;
  }

  #gallery-background {
    background: black;
    z-index: -1;
    pointer-events: none;
    cursor: none;
    width: 100vw;
    height: 100vh;

    &.show-on-hover {
      display: block;
    }

    &.in-gallery {
      display: block;
      pointer-events: all;
    }

    &.zooming {
      cursor: zoom-in !important;

      &.zoomed-in {
        pointer-events: none;
      }
    }
  }

  :root {
    /* --gallery-menu-background: rgba(0, 0, 0, 0.75); */
    --gallery-menu-background: rgba(0, 0, 0, 1);
    --gallery-menu-size: 80px;
  }

  #gallery-menu {
    pointer-events: none;
    position: fixed;
    display: flex;
    justify-content: flex-end;
    top: 0;
    left: 0;
    width: 100vw;
    height: var(--gallery-menu-size);
    z-index: 20;
    background: transparent;
    transform: translateY(-100%);
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0, 0, 0.25, 1), opacity 0.25s cubic-bezier(0, 0, 0.25, 1);

    #dock-gallery {

      >img,
      >svg {
        transform: rotateZ(-90deg) !important;
      }
    }


    &.active,
    &.persistent,
    &.pinned {
      opacity: 1;
      transform: translateY(0%);
    }

    &.dock-left {
      width: var(--gallery-menu-size);
      height: 100vh;
      top: 0;
      left: 0;
      transform: translateX(-100%);

      &.active,
      &.persistent,
      &.pinned {
        opacity: 1;
        transform: translateX(0%);
      }

      #dock-gallery {

        >img,
        >svg {
          transform: none !important;
        }
      }

      #gallery-menu-button-container {
        max-width: 100%;
        flex-direction: column;
        justify-content: flex-start;
        margin: 0;
      }

      .gallery-menu-button {
        max-width: 100%;
        margin: 0;

        >img,
        svg {
          width: 75% !important;
          height: auto;
        }
      }
    }

    &.pinned {
      #pin-gallery {

        >img,
        >svg {
          /* fill: #0075FF; */
          transform: rotateZ(90deg) !important;
        }
      }
    }

    * {
      position: static;
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  }

  #gallery-menu-button-container {
    display: flex;
    justify-content: center;
    height: 100%;
    /* margin: 0px 20px 0px 0px; */
    width: fit-content;
    background: var(--gallery-menu-background);
  }

  .gallery-menu-button {
    pointer-events: all;
    display: inline-block;
    align-content: center;
    text-align: center;
    aspect-ratio: 1;
    cursor: pointer;
    filter: grayscale(50%);
    opacity: 0.75;
    transition: transform 0.25s cubic-bezier(0, 0, 0.25, 1);

    >img,
    svg {
      pointer-events: none;
      height: 75% !important;
      transform: none !important;
      transition: transform 0.25s ease;
    }
  }


  :root {
    --rainbow: linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet);
  }


  #add-favorite-gallery {
    >svg {
      fill: white;
    }

  }

  @keyframes glowSwipe {
    0% {
      left: -100%;
    }

    100% {
      left: 100%;
    }
  }

  #gallery-menu-background-color-picker {
    position: absolute;
    visibility: hidden;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
  }

  #gallery-mobile-menu {
    position: fixed;
    pointer-events: all;
    top: 0;
    left: 0;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.75);
  }
`;
export const MOBILE_CSS = `
  #performance-profile-container,
  #show-hints-container,
  #whats-new-link,
  #show-ui-div,
  #search-header,
  #fullscreen-gallery,
  #exit-gallery,
  #background-color-gallery,
  #left-favorites-panel-top-row,
  #layout-select-row,
  #favorite-finder {
    display: none !important;
  }

  #favorites-pagination-container>button {

    &:active,
    &:focus {
      background-color: slategray;
    }

    &:hover {
      background-color: transparent;
    }
  }

  .thumb,
  .favorite {
    >div>canvas {
      display: none;
    }
  }

  #more-options-label {
    margin-left: 6px;
  }

  .checkbox {
    margin-bottom: 8px;

    input[type="checkbox"] {
      margin-right: 10px;
    }
  }

  #mobile-container {
    position: fixed !important;
    z-index: 30;
    width: 100vw;
    top: 0px;
    left: 0px;
  }

  #favorites-search-gallery-menu-panels {
    display: block !important;
  }

  #right-favorites-panel {
    margin-left: 0px !important;
  }

  #left-favorites-panel-bottom-row {
    margin: 4px 0px 0px 0px !important;
  }

  #additional-favorite-options-container {
    margin-right: 5px;
  }

  #favorites-search-gallery-content {
    grid-gap: 1.2cqw;
    padding: 0px 5px 20px 5px !important;
    margin-right: 0px !important;
  }

  #favorites-search-gallery-menu {
    padding: 7px 5px 5px 5px;
    top: 0;
    left: 0;
    width: 100vw;


    &.fixed {
      position: fixed;
      margin-top: 0;
    }
  }

  #favorites-load-status-label {
    display: inline;
  }

  textarea {
    border-radius: 0px;
    height: 50px;
    padding: 8px 0px 8px 10px !important;
  }

  select {
    width: 120px !important;
    min-height: 30px !important;
    margin-bottom: 2px;
  }

  body {
    width: 100% !important;
  }

  #favorites-pagination-container>button {
    text-align: center;
    font-size: 16px;
    height: 30px;
  }

  #goto-page-input {
    top: -1px;
    position: relative;
    height: 25px;
    width: 1em !important;
    text-align: center;
    font-size: 16px;
  }

  #goto-page-button {
    display: none;
    height: 36px;
    position: absolute;
    margin-left: 5px;
  }

  #additional-favorite-options {
    .number {
      display: none;
    }
  }

  #results-per-page-container {
    margin-bottom: 10px;
  }

  #bottom-panel-3,
  #bottom-panel-4 {
    flex: none !important;
  }

  #bottom-panel-2 {
    padding-top: 8px;
  }

  #rating-container {
    position: relative;
    left: -5px;
    top: -2px;
    display: none;
  }

  #favorites-pagination-container>button {
    &[disabled] {
      opacity: 0.25;
      pointer-events: none;
    }
  }

  html {
    -webkit-tap-highlight-color: transparent;
    -webkit-text-size-adjust: 100%;
  }

  #additional-favorite-options {
    select {
      width: 120px;
    }
  }

  .utility-button {
    filter: none;
    width: 60%;
  }

  #left-favorites-panel-bottom-row {
    overflow: hidden;
    /* -webkit-transition: height 0.2s ease;
    -moz-transition: height 0.2s ease;
    -ms-transition: height 0.2s ease;
    -o-transition: height 0.2s ease;
    transition: height 0.2s ease; */
    height: 270px;

    &.hidden {
      height: 0px;
    }
  }

  #favorites-search-gallery-content.sticky-menu-shadow {
    /* transition: margin 0.2s ease; */
  }

  #favorites-search-gallery-content.sticky-menu {
    margin-top: 340px !important;
  }

  #autoplay-settings-menu {
    >div {
      font-size: 14px !important;
    }
  }

  #results-columns-container {
    margin-top: -6px;
  }

  #mobile-toolbar-row {
    display: flex;
    align-items: center;
    background: none;

    svg {
      fill: black;
      -webkit-transition: none;
      transition: none;
      transform: scale(0.85);
    }

    input[type="checkbox"]:checked+label {
      svg {
        fill: #0075FF;
      }

      color: #0075FF;
    }

    .dark-green-gradient {
      svg {
        fill: white;
      }
    }
  }

  .search-bar-container {
    align-content: center;
    width: 100%;
    height: 40px;
    border-radius: 50px;
    padding-left: 10px;
    padding-right: 10px;
    flex: 1;

    &.light-green-gradient {
      background: white !important;
    }

    &.dark-green-gradient {
      background: #303030;
    }
  }

  .search-bar-items {
    display: flex;
    align-items: center;
    height: 100%;
    width: 100%;

    >div {
      flex: 0;
      min-width: 40px;
      width: 100%;
      height: 100%;
      display: block;
      align-content: center;
    }
  }

  .search-icon-container {
    flex: 0;
    min-width: 40px;
  }

  .search-bar-input-container {
    flex: 1 !important;
    display: flex;
    width: 100%;
    height: 100%;
  }

  .search-bar-input {
    flex: 1;
    border: none;
    box-sizing: content-box;
    height: 100%;
    padding: 0;
    margin: 0;
    outline: none !important;
    border: none !important;
    font-size: 14px !important;
    width: 100%;

    &:focus,
    &:focus-visible {
      background: none !important;
      border: none !important;
      outline: none !important;
    }
  }

  .search-clear-container {
    visibility: hidden;

    svg {
      transition: none !important;
      transform: scale(0.6) !important;
    }
  }

  .circle-icon-container {
    padding: 0;
    margin: 0;
    align-content: center;
    border-radius: 50%;

    &:active {
      background-color: #0075FF;
    }
  }

  #options-checkbox {
    display: none;
  }

  .mobile-toolbar-checkbox-label {
    width: 100%;
    height: 100%;
    display: block;
  }

  #reset-button {
    transition: none !important;
    height: 100%;

    >svg {
      transition: none !important;
      transform: scale(0.65);
    }

    &:active {
      svg {
        fill: #0075FF;
      }
    }
  }

  #help-button {
    height: 100%;

    >svg {
      transform: scale(0.75);
    }
  }

  #sort-ascending-toggle-switch {
    transform: scale(0.6) !important;
  }

  #sort-inputs>.toggle-switch {
    display: inline-block;
  }

  #sort-inputs {
    margin-top: -5px;
  }

  #layout-sort-container {
    margin-bottom: 4px !important;
  }

  #mobile-footer {
    padding-top: 4px;
    z-index: 10;

    position: fixed;
    width: 100%;
    bottom: -1px;
    left: 0;
    /* padding: 4px 0px; */

    >div {
      text-align: center;
    }

    &.light-green-gradient {
      background: linear-gradient(to top, #aae5a4, #89e180);
    }

    &.dark-green-gradient {
      background: linear-gradient(to top, #5e715e, #293129);

    }
  }

  #mobile-footer-top {
    margin-bottom: 4px;
  }

  #mobile-footer-bottom {
    margin-bottom: 5px;
  }

  #favorites-load-status {
    font-size: 12px !important;

    >span {
      margin-right: 10px;
    }

    >span:nth-child(odd) {
      font-weight: bold;
    }

    >label {
      /* width: 300px; */
      min-width: unset !important;
    }
  }

  #favorites-load-status-label {
    padding-left: 0 !important;
  }

  #pagination-number:active {
    opacity: 0.5;
  }

  #favorites-pagination-container>button {
    min-width: 30px !important;
    width: unset !important;
  }

  #results-per-page-container {
    margin-bottom: unset !important;
  }

  #gallery-menu {
    justify-content: center !important;
  }

  #download-button {
    font-size: large;
    border-radius: 4px;
    border: none;
  }

  #download-menu-container-wrapper {
    width: unset !important;
  }

  #download-menu-options select {
    font-size: 30px !important;
  }

  input[type="text"] {
    font-size: 16px !important;
  }
`;
export const SKELETON_CSS = `
  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    padding: 0px 30px;
  }

  .skeleton-column {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .skeleton-item {
    background: #555;
    overflow: hidden;
    z-index: 0;
  }

  .skeleton-item.pulse {
    animation: pulse var(--skeleton-animation-duration, 1s) infinite ease-in-out;
    animation-delay: var(--skeleton-animation-delay, 0s);
  }

  .skeleton-item.shine::after {
    background-image: linear-gradient(90deg, rgba(0, 0, 0, 0), rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0));
    content: "";
    position: absolute;
    transform: translateX(-100%);
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
    animation: shine var(--skeleton-animation-duration, 1s) linear infinite;
    animation-delay: var(--skeleton-animation-delay, 0s);
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes shine {
    0% {
      transform: translateX(-100%);
    }

    50% {
      transform: translateX(100%);
    }

    100% {
      transform: translateX(-100%);
    }
  }
`;
export const TILE_CSS = `
  .row,
  .column,
  .column .actual-column,
  .square,
  .grid {
    gap: 6px;
  }

  .grid,
  .square {
    display: grid !important;
    grid-template-columns: repeat(10, 1fr);
    grid-gap: 0.5cqw;

    .utility-button {
      width: 30%;
    }
  }

  .square {

    .favorite,
    thumb {
      border-radius: var(--radius) !important;
      overflow: hidden;
      aspect-ratio: 1;

      >a,
      >div {
        width: 100%;
        height: 100%;

        >img:first-child,
        >canvas {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
  }

  .row {
    display: flex;
    flex-wrap: wrap;

    .favorite,
    .thumb {

      &.last-row {
        flex: 0 1 auto;
      }

      height: 300px;
      flex: 1 1 auto;
      border-radius: var(--radius);
      overflow: hidden;
    }

    .favorite,
    .thumb {

      >a,
      >div {

        width: 100%;
        height: 100%;

        >img:first-child {
          object-fit: cover;
          width: 100%;
          height: 100%;
          vertical-align: middle;
        }

        >canvas {
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .utility-button {
      height: 30%;
    }
  }

  .column {
    display: grid;
    grid-template-columns: repeat(10, 1fr);

    .actual-column {
      display: flex;
      flex-direction: column;
      flex: 0 0 25%;

      .favorite,
      .thumb {
        border-radius: var(--radius);
        overflow: hidden;
      }
    }

    .utility-button {
      width: 30%;
    }
  }

  .native {
    display: flex;
    flex-flow: wrap;
    gap: 25px 10px;

    .utility-button {
      width: 70px;
      aspect-ratio: 1;
    }
  }
`;
