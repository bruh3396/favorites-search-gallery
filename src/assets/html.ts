export const AUTOPLAY_HTML = `
<div id="autoplay-container">
  <style>
    #autoplay-container {
      visibility: hidden;
    }

    #autoplay-menu {
      position: fixed;
      left: 50%;
      transform: translate(-50%);
      bottom: 5%;
      padding: 0;
      margin: 0;
      /* background: rgba(40, 40, 40, 1); */
      background: var(--gallery-menu-background);
      border-radius: 4px;
      white-space: nowrap;
      z-index: 10000;
      opacity: 0;
      transition: opacity .25s ease-in-out;

      &.visible {
        opacity: 1;
      }

      &.persistent {
        opacity: 1 !important;
        visibility: visible !important;
      }

      >div>img {
        color: red;
        position: relative;
        height: 75px;
        cursor: pointer;
        background-color: rgba(128, 128, 128, 0);
        margin: 5px;
        background-size: 10%;
        z-index: 3;
        border-radius: 4px;


        &:hover {
          background-color: rgba(200, 200, 200, .5);
        }
      }
    }

    .autoplay-progress-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 0%;
      height: 100%;
      background-color: steelblue;
      z-index: 1;

      /* position: fixed !important;
      top: 0;
      left: 0;
      width: 0;
      height: 4px;
      background: #ff5733;
      z-index: 1; */
    }

    body.autoplay::before {
      content: "";
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 4px;
      background: #ff5733;
      animation: progress 5s linear forwards;
      z-index: 9999;
    }

    @keyframes progress {
      from {
        width: 0;
      }

      to {
        width: 100%;
      }
    }


    #autoplay-video-progress-bar {
      background-color: royalblue;
    }

    #autoplay-settings-menu {
      visibility: hidden;
      position: absolute;
      top: 0;
      left: 50%;
      transform: translate(-50%, -105%);
      border-radius: 4px;
      font-size: 10px !important;
      background: var(--gallery-menu-background);

      &.visible {
        visibility: visible;
      }

      >div {
        font-size: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 10px;
        color: white;


        >label {
          padding-right: 20px;
        }

        >.number {
          background: none;
          outline: 2px solid white;

          >hold-button,
          >button {
            &::after {
              width: 200%;
              height: 130%;
            }
          }

          >input[type="number"] {
            color: white;
            width: 7ch;
          }
        }
      }

      select {
        /* height: 25px; */
        font-size: larger;
        width: 10ch;
      }
    }

    #autoplay-settings-button.settings-menu-opened {
      filter: drop-shadow(6px 6px 3px #0075FF);
    }


    #autoplay-change-direction-mask {
      filter: drop-shadow(2px 2px 3px #0075FF);
    }

    #autoplay-play-button:active {
      filter: drop-shadow(2px 2px 10px #0075FF);
    }

    #autoplay-change-direction-mask-container {
      pointer-events: none;
      opacity: 0.75;
      height: 75px;
      width: 75px;
      margin: 5px;
      border-radius: 4px;
      right: 0;
      bottom: 0;
      z-index: 4;
      position: absolute;
      clip-path: polygon(0% 0%, 0% 100%, 100% 100%);

      &.upper-right {
        clip-path: polygon(0% 0%, 100% 0%, 100% 100%);
      }
    }

    .autoplay-settings-menu-label {
      pointer-events: none;
    }
  </style>
  <div id="autoplay-menu" class="not-highlightable gallery-sub-menu">
    <div id="autoplay-buttons">
      <img id="autoplay-settings-button" title="Autoplay settings">
      <img id="autoplay-play-button" title="Pause autoplay">
      <img id="autoplay-change-direction-button" title="Change autoplay direction">
      <div id="autoplay-change-direction-mask-container">
        <img id="autoplay-change-direction-mask" title="Change autoplay direction">
      </div>
    </div>
    <div id="autoplay-image-progress-bar" class="autoplay-progress-bar"></div>
    <div id="autoplay-video-progress-bar" class="autoplay-progress-bar"></div>
    <div id="autoplay-settings-menu">
      <div>
        <label for="autoplay-image-duration-input">Image/GIF Duration</label>
        <span class="number">
          <hold-button class="number-arrow-down" pollingtime="50"><span>&lt;</span></hold-button>
          <input type="number" id="autoplay-image-duration-input" min="1" max="60" step="1">
          <hold-button class="number-arrow-up" pollingtime="50"><span>&gt;</span></hold-button>
        </span>
      </div>
      <div>
        <label for="autoplay-minimum-video-duration-input">Minimum Video Duration</label>
        <span class="number">
          <hold-button class="number-arrow-down" pollingtime="50"><span>&lt;</span></hold-button>
          <input type="number" id="autoplay-minimum-animated-duration-input" min="0" max="60" step="1">
          <hold-button class="number-arrow-up" pollingtime="50"><span>&gt;</span></hold-button>
        </span>
      </div>
    </div>
  </div>
</div>
`;
export const CAPTION_HTML = `
<style>
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
</style>
`;
export const DARK_THEME_HTML = `
<style>
  input[type=number] {
    background-color: #303030;
    color: white;
  }

  .number {
    background-color: #303030;

    >hold-button,
    button {
      color: white;
    }
  }

  #favorites-pagination-container {
    >button {
      border: 1px solid white !important;
      color: white !important;
    }
  }
</style>
`;
export const DESKTOP_HTML = `
<style>
  .checkbox {
    &:hover {
      color: #000;
      background: #93b393;
      text-shadow: none;
      cursor: pointer;
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
    height: 32px;
  }
</style>
`;
export const DOWNLOADER_HTML = `
<style>
  body.download-menu-open {
    overflow: hidden;
  }

  body.download-menu-open::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    z-index: 9999;
  }

  #download-menu {
    background: transparent;

    border: none;
    gap: 10px;
    padding: 0;
    overflow: hidden;
  }

  #download-menu-container {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
    gap: 10px;
    border-radius: 10px;
  }

  #download-menu-container-wrapper {
    display: flex;
    width: 450px;
    height: 150px;
    flex-direction: column;
    gap: 2px;
  }

  #download-menu-container-wrapper-inner {
    display: flex;
    padding: 10px;
    border-radius: 8px;
    height: 100%;
  }

  #download-menus button {
    width: 100%;
    height: 4rem;
    border-radius: 8px;
    font-size: large;
  }

  #download-menu.downloading #download-menu-buttons-start-download {
    display: none;
  }

  #download-menu.downloading #download-menu-options {
    display: none;
  }

  #download-menu.downloading #download-menu-status {
    flex: 1 1 100%;
  }

  #download-menu-options {
    flex: 1 0 25%;
    text-align: center;
  }

  #download-menu-options select {
    width: 100%;
    font-size: 15px;
    height: 25x;
  }


  #download-menu-buttons {
    display: flex;
    gap: 10px;
    flex-direction: column;
    flex: 1 0 15%;
  }

  #download-menu-buttons button {
    flex: 1 1 100%;
  }

  #download-menu-status {
    flex: 0 0 0%;
    display: flex;
    flex-direction: column;
    gap: 2px;
    /* transition: flex 0.15s linear; */
  }

  #download-menu-status-header {
    text-align: center;
    margin: 0;
    background: transparent;
  }

  #download-menu-status-header.dark-green-gradient {
    color: white;
  }

  #download-menu-status span {
    font-size: medium;
  }

  #download-menu p {
    color: black;
  }

  #download-menu-warning-container button {
    margin: auto;
    border-radius: 8px;
  }

  #download-menu-warning-container {
    text-align: center;
  }

  #download-menu-help {
    display: flex;
    flex: 0 0 5%;
    align-items: center;
    justify-content: center;
  }

  #download-menu-help button {
    background: transparent;
    width: 100%;
    aspect-ratio: 1;
    border: none;
    position: relative;
  }

  #download-menu-help button:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  #download-menu-help svg {
    background: transparent !important;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
  }

  #download-menu-help svg.dark-green-gradient {
    fill: white;
  }

  #download-menu-help-text {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 500px;
    transform: translateY(100%);
    background: gray;
    color: black;
  }
</style>

<div id="download-menus">
  <dialog id="download-menu">
    <div id="download-menu-container-wrapper">
      <h1 id="download-menu-status-header" class="light-green-gradient">Download</h1>
      <div id="download-menu-container-wrapper-inner" class="light-green-gradient">
        <div id="download-menu-container">
          <div id="download-menu-buttons">
            <button id="download-menu-buttons-start-download">Download</button>
            <button id="download-menu-buttons-cancel-download">Cancel</button>
          </div>
          <div id="download-menu-options" class="download-menu-setup">
            <div id="download-menu-options-batch-size-container">
              <span>Batch Size</span>
              <select id="download-menu-options-batch-size">
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
              </select>
            </div>
          </div>
          <div id="download-menu-status">
          </div>
          <!-- <div id="download-menu-help">
            <button>
              <svg class="light-green-gradient" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                <path
                  d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
              </svg>
            </button>
          </div> -->
        </div>
      </div>
    </div>
    <!-- <div id="download-menu-help-text">
      <p>
        This is some text that will be displayed in the download menu. It can be used to provide information or instructions to the user.
      </p>
    </div> -->
  </dialog>
  <dialog id="download-menu-warning" class="light-green-gradient">
    <div id="download-menu-warning-container">
      <h1>Wait for all favorites to load before downloading</h1>
      <form method="dialog"><button>Close</button></form>
    </div>
  </dialog>
</div>
`;
export const FANCY_HOVERING_HTML = `
<style>
  #caption-list {
    transform: scale(0.8);
  }

  #favorites-search-gallery-content {
    padding: 40px 40px 30px !important;
    grid-gap: 1cqw !important;
  }

  .favorite,
  .thumb {

    >a,
    >span,
    >div {
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s ease-in-out;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        z-index: -1;
        width: 100%;
        height: 100%;
        opacity: 0;
        top: 0;
        left: 0;
        border-radius: 5px;
        box-shadow: 5px 10px 15px rgba(0, 0, 0, 0.45);
        transition: opacity 0.3s ease-in-out;
      }

      &:hover {
        outline: none !important;
        transform: scale(1.2, 1.2);
        z-index: 10;

        img {
          outline: none !important;
        }

        &::after {
          opacity: 1;
        }
      }
    }
  }
</style>
`;
export const FAVORITES_HTML = `
<div id="favorites-search-gallery-menu" class="light-green-gradient not-highlightable">
  <style>
    #favorites-search-gallery-menu {
      position: sticky;
      top: 0;
      padding: 10px;
      z-index: 30;
      margin-bottom: 10px;

      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
      }

      select {
        cursor: pointer;
        min-height: 25px;
        width: 150px;
        margin-top: 2px;
      }
    }

    #favorites-search-gallery-menu-panels {
      >div {
        flex: 1;
      }
    }

    #left-favorites-panel {
      flex: 10 !important;

      >div:first-of-type {
        margin-bottom: 5px;

        >label {
          align-content: center;
          margin-right: 5px;
          margin-top: 4px;
        }

        >button {
          height: 35px;
          border: none;
          border-radius: 4px;

          &:hover {
            filter: brightness(140%);
          }
        }

        >button[disabled] {
          filter: none !important;
          cursor: wait !important;
        }
      }
    }

    #right-favorites-panel {
      flex: 9 !important;
      margin-left: 30px;
      display: none;
    }

    textarea {
      max-width: 100%;
      height: 50px;
      width: 98%;
      padding: 10px;
      border-radius: 6px;
      resize: vertical;
    }

    button,
    input[type="checkbox"] {
      cursor: pointer;
    }

    .checkbox {
      display: block;
      padding: 2px 6px 2px 0px;
      border-radius: 4px;
      margin-left: -3px;
      height: 27px;

      >input {
        vertical-align: -5px;
      }
    }

    #loading-wheel {
      border: 16px solid #f3f3f3;
      border-top: 16px solid #3498db;
      border-radius: 50%;
      width: 120px;
      height: 120px;
      animation: spin 1s ease-in-out infinite;
      pointer-events: none;
      z-index: 9990;
      position: fixed;
      max-height: 100vh;
      margin: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }

      100% {
        transform: rotate(360deg);
      }
    }

    .download-button {
      bottom: 0 !important;
      right: 0 !important;
      left: unset !important;
      top: unset !important;
      color: #0075FF;
    }

    .download-button svg {
      fill: #0075FF;
    }

    img {
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
    }


    #column-count-container {
      >div {
        align-content: center;
      }
    }

    #favorite-finder {
      margin-top: 7px;

      >button {
        white-space: nowrap;
        border-radius: 4px;
        height: 30px;
      }

      >button:last-of-type {
        margin-left: 4px;
        margin-bottom: 5px;
      }

      >input {
        width: 75px;
        /* border-radius: 6px;
        height: 35px;
        border: 1px solid; */
      }
    }

    #favorites-pagination-container {
      padding: 0px 10px 0px 10px;

      >button {
        background: transparent;
        margin: 0px 2px;
        padding: 2px 6px;
        border: 1px solid black;
        font-size: 14px;
        color: black;
        font-weight: normal;
        width: 6ch;

        &:hover {
          background-color: #93b393;
        }

        &.selected {
          border: none !important;
          font-weight: bold;
          pointer-events: none;
        }

        &[disabled] {
          background-color: transparent !important;
        }
      }
    }



    #help-links-container {
      /* >a:not(:last-child)::after {
        content: " |";
      } */
      display: flex;
      flex-direction: column;

      >a {
        font-size: x-large;
      }

      margin-top: 17px;
    }

    #whats-new-link {
      cursor: pointer;
      padding: 0;
      position: relative;
      font-weight: bolder;
      font-style: italic;
      background: none;
      text-decoration: none !important;

      &.hidden:not(.persistent)>div {
        display: none;
      }

      &.persistent,
      &:hover {
        &.light-green-gradient {
          color: black;
        }

        &:not(.light-green-gradient) {
          color: white;
        }
      }
    }

    #whats-new-container {
      z-index: 10;
      top: 20px;
      right: 0;
      transform: translateX(25%);
      font-style: normal;
      font-weight: normal;
      white-space: nowrap;
      max-width: 100vw;
      padding: 5px 20px;
      position: absolute;
      pointer-events: none;
      text-shadow: none;
      border-radius: 2px;

      &.light-green-gradient {
        outline: 2px solid black;

      }

      &:not(.light-green-gradient) {
        outline: 1.5px solid white;
      }

      ul {
        padding-left: 20px;
      }

      h5,
      h6 {
        color: rgb(255, 0, 255);
      }
    }

    .hotkey {
      font-weight: bolder;
      color: orange;
    }

    #left-favorites-panel-bottom-row {
      display: flex;
      margin-top: 10px;
      flex-wrap: nowrap;

      >div {
        flex: 1;
      }

      .number {
        font-size: 16px;

        >input {
          width: 5ch;
        }
      }
    }

    #additional-favorite-options {
      >div:not(:last-child) {
        margin-bottom: 10px;
      }
    }

    .number-label-container {
      display: inline-block;
      min-width: 130px;
    }

    #show-ui-container.ui-hidden {
      label {
        text-align: center;
      }

      max-width: 100vw;
      text-align: center;
      align-content: center;
    }

    #rating-container {
      white-space: nowrap;
    }

    #allowed-ratings {
      margin-top: 5px;
      font-size: 12px;

      >label {
        outline: 1px solid;
        padding: 3px;
        cursor: pointer;
        opacity: 0.5;
        position: relative;
      }

      >label[for="explicit-rating"] {
        border-radius: 7px 0px 0px 7px;
        margin-right: 2px;
      }

      >label[for="questionable-rating"] {
        margin-right: 2px;
      }

      >label[for="safe-rating"] {
        border-radius: 0px 7px 7px 0px;
      }

      >input[type="checkbox"] {
        display: none;

        &:checked+label {
          background-color: #0075FF;
          color: white;
          opacity: 1;
        }
      }
    }


    #favorites-load-status {
      >label {
        display: inline-block;
        min-width: 100px;
        margin-right: 20px;
      }
    }

    #main-favorite-options-container {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;

      >div {
        flex-basis: 45%;
      }
    }

    #sort-ascending {
      position: absolute;
      top: 18px;
      left: 150px;
      width: 20px;
      height: 20px;
    }

    #favorite-finder-input {
      border: none !important;
    }

    div#header {
      margin-bottom: 0 !important;
    }

    body {
      overflow-x: hidden;
    }

    #goto-page-input {
      width: 5ch;
    }

    #left-favorites-panel-top-row {
      margin-top: 10px;
    }

    #sort-container {
      position: relative;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
      transform: scale(.75);
      align-content: center;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      -webkit-transition: .4s;
      transition: .4s;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      -webkit-transition: .4s;
      transition: .4s;
    }

    input:checked+.slider {
      background-color: #0075FF;
    }

    input:focus+.slider {
      box-shadow: 0 0 1px #0075FF;
    }

    input:checked+.slider:before {
      -webkit-transform: translateX(26px);
      -ms-transform: translateX(26px);
      transform: translateX(26px);
    }

    .slider.round {
      border-radius: 34px;
    }

    .slider.round:before {
      border-radius: 50%;
    }

    .toggle-switch-label {
      margin-left: 60px;
      margin-top: 20px;
      font-size: 16px;
    }

    .inline-option-container {
      >div {
        display: inline-block;
      }
    }

    #sorting-method-id {
      display: none;
    }
  </style>
  <div id="favorites-search-gallery-menu-panels" style="display: flex;">
    <div id="left-favorites-panel">
      <h2 style="display: inline;" id="search-header">Search Favorites</h2>
      <span id="favorites-load-status" style="margin-left: 5px;">
        <label id="match-count-label"></label>
        <label id="favorites-load-status-label"></label>
      </span>
      <span id="favorites-pagination-placeholder"></span>
      <div id="left-favorites-panel-top-row">
      </div>
      <div id="left-favorites-panel-bottom-row">
        <div id="bottom-panel-1">
          <div class="options-container">
            <div id="main-favorite-options-container">
              <div id="favorite-options">
              </div>
              <div id="dynamic-favorite-options">
              </div>
            </div>
          </div>
        </div>

        <div id="bottom-panel-2">
          <div id="additional-favorite-options-container" class="options-container">
            <div id="additional-favorite-options">
              <div id="layout-sort-container" class="inline-option-container">
                <div id="layout-container">
                  <label>Layout</label>
                  <br>
                </div>
                <div id="sort-container" title="Change sorting order of search results">
                  <span id="sort-labels">
                    <label style="margin-right: 22px;" for="sorting-method">Sort By</label>
                    <label style="margin-left:  22px;" for="sort-ascending">Ascending</label>
                  </span>
                  <div id="sort-inputs">
                  </div>
                </div>
              </div>
              <div id="results-columns-container" class="inline-option-container">
                <div id="results-per-page-container"
                  title="Set the maximum number of search results to display on each page\nLower numbers improve responsiveness">
                  <span class="number-label-container">
                    <label id="results-per-page-label" for="results-per-page-input">Results per Page</label>
                  </span>
                  <br>
                </div>
                <div id="column-count-container" title="Set the number of favorites per row">
                  <div>
                    <span class="number-label-container">
                      <label id="column-count-label">Columns</label>
                    </span>
                    <br>
                  </div>
                </div>
                <div id="row-size-container" title="Set the height of each row">
                  <div>
                    <span class="number-label-container">
                      <label id="row-size-label">Row height</label>
                    </span>
                    <br>
                  </div>
                </div>
              </div>
              <div id="rating-container" title="Filter search results by rating">
              </div>
              <div id="performance-profile-container" title="Improve performance by disabling features">
                <label for="performance-profile">Performance Profile</label>
                <br>
              </div>
            </div>
          </div>
        </div>

        <div id="bottom-panel-3">
          <div id="show-ui-wrapper">
          </div>
          <div class="options-container">
          </div>
        </div>

        <div id="bottom-panel-4">

        </div>
      </div>
    </div>
    <div id="right-favorites-panel"></div>
  </div>
</div>
`;
export const FAVORITES_CONTENT_HTML = `
<style>
  html {
    width: 100vw;
  }

  #favorites-search-gallery-content {
    padding: 0px 20px 30px 20px;
    margin-right: 15px;

    &.grid,
    &.square {
      display: grid !important;
      grid-template-columns: repeat(10, 1fr);
      grid-gap: 0.5cqw;

      .utility-button {
        width: 30%;
      }
    }

    &.square {
      .favorite {
        border-radius: 10px !important;
        overflow: hidden;
        aspect-ratio: 1 / 1;

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

    &.row {
      display: flex;
      flex-wrap: wrap;

      .favorite {

        &.last-row {
          flex: 0 1 auto;
          /* opacity: 0.1; */
        }

        height: 300px;
        flex: 1 1 auto;
        border-radius: 10px;
        overflow: hidden;
      }

      .favorite {

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

    &.column {
      display: grid;
      grid-template-columns: repeat(10, 1fr);

      .favorites-column {
        display: flex;
        flex-direction: column;
        flex: 0 0 25%;

        .favorite {
          border-radius: 10px;
          overflow: hidden;
        }
      }

      .utility-button {
        width: 30%;
      }
    }
  }

  .favorite {
    position: relative;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;

    >a,
    >div {
      display: block;
      overflow: hidden;
      position: relative;
      cursor: default;

      >img:first-child {
        width: 100%;
        z-index: 1;
      }

      >a>div {
        height: 100%;
      }

      >canvas {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 1;
      }
    }

    &.hidden {
      display: none;
    }
  }

  .utility-button {
    cursor: pointer;
    position: absolute;
    left: 0;
    top: 0;
    font-weight: bold;
    background: none;
    border: none;
    z-index: 2;
    filter: grayscale(70%);

    &:active,
    &:hover {
      filter: none !important;
    }
  }
</style>
`;
export const GALLERY_HTML = `
<style>
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
    /* display: none; */
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
    --gallery-menu-size: 70px;
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

    &:hover {
      opacity: 1;
      transform: scale(1.25);
    }

    >img,
    svg {
      pointer-events: none;
      height: 75% !important;
      transform: none !important;
      transition: transform 0.25s ease;
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
</style>
`;
export const HELP_HTML = `
<span id="help-links-container">
  <a href="https://github.com/bruh3396/favorites-search-gallery/#controls" target="_blank">Controls</a>
  <br>
  <a href="https://sleazyfork.org/en/scripts/504184-rule34-favorites-search-gallery/feedback"
    target="_blank">Feedback</a>
  <br>
  <a href="https://github.com/bruh3396/favorites-search-gallery/issues" target="_blank">Report
    Issue</a>
  <br>
  <a id="whats-new-link" href="" class="hidden light-green-gradient">What's new?
    <div id="whats-new-container" class="light-green-gradient">
      <h4>1.19:</h4>
      <h5>Features:</h5>
      <ul>
        <li>New favorites layouts</li>
        <ul>
          <li>Waterfall (column)</li>
          <li>River (row)</li>
          <li>Square</li>
          <li>Legacy (grid)</li>
        </ul>
        <li>Infinite favorites scroll option added</li>
        <ul>
          <li>Page option still available</li>
        </ul>
        <li>Infinite gallery on search pages</li>
        <ul>
          <li>Go to next search page without ever exiting gallery</li>
        </ul>
        <li>Download images</li>
        <ul>
          <li>Experimental for now</li>
        </ul>
        <li>New gallery hotkeys</li>
        <ul>
          <li>F: Fullscreen</li>
          <li>G: Open post</li>
          <li>Q: Open original</li>
          <li>E: Add favorite</li>
        </ul>
      </ul>
    </div>
  </a>
</span>
`;
export const MOBILE_HTML = `
<style>
  #performance-profile-container,
  #show-hints-container,
  #whats-new-link,
  #show-ui-div,
  #search-header,
  #row-size-container,
  #left-favorites-panel-top-row,
  #favorite-finder,
  #layout-container {
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
    padding: 0px 5px 20px  5px !important;
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
    transition: height 0.2s ease;
    -webkit-transition: height 0.2s ease;
    -moz-transition: height 0.2s ease;
    -ms-transition: height 0.2s ease;
    -o-transition: height 0.2s ease;
    transition: height 0.2s ease;
    height: 200px;

    &.hidden {
      height: 0px;
    }
  }

  #favorites-search-gallery-content.sticky {
    transition: margin 0.2s ease;
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

  #sort-inputs {
    margin-top: -5px;
  }
</style>
`;
export const SAVED_SEARCHES_HTML = `
<div id="saved-searches">
  <style>
    #saved-searches-container {
      margin: 0;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    #saved-searches-input-container {
      margin-bottom: 10px;
    }

    #saved-searches-input {
      flex: 15 1 auto;
      margin-right: 10px;
    }

    #savedSearches {
      max-width: 100%;

      button {
        flex: 1 1 auto;
        cursor: pointer;
      }
    }

    #saved-searches-buttons button {
      margin-right: 1px;
      margin-bottom: 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      height: 35px;

      &:hover {
        filter: brightness(140%);
      }
    }

    #saved-search-list-container {
      direction: rtl;
      max-height: 200px;
      overflow-y: auto;
      overflow-x: hidden;
      margin: 0;
      padding: 0;
    }

    #saved-search-list {
      direction: ltr;
      >li {
        display: flex;
        flex-direction: row;
        cursor: pointer;
        background: rgba(0, 0, 0, .1);

        &:nth-child(odd) {
          background: rgba(0, 0, 0, 0.2);
        }

        >div {
          padding: 4px;
          align-content: center;

          svg {
            height: 20px;
            width: 20px;
          }
        }
      }
    }

    .save-search-label {
      flex: 1000 30px;
      text-align: left;

      &:hover {
        color: white;
        background: #0075FF;
      }
    }

    .edit-saved-search-button {
      text-align: center;
      flex: 1 20px;

      &:hover {
        color: white;
        background: slategray;
      }
    }

    .remove-saved-search-button {
      text-align: center;
      flex: 1 20px;

      &:hover {
        color: white;
        background: #f44336;
      }
    }

    .move-saved-search-to-top-button {
      text-align: center;

      &:hover {
        color: white;
        background: steelblue;
      }
    }

    /* .tag-type-saved>a,
    .tag-type-saved {
      color: lightblue;
    } */
  </style>
  <h2>Saved Searches</h2>
  <div id="saved-searches-buttons">
    <button title="Save custom search" id="save-custom-search-button">Save</button>
    <button id="stop-editing-saved-search-button" style="display: none;">Cancel</button>
    <span>
      <button title="Export all saved searches" id="export-saved-search-button">Export</button>
      <button title="Import saved searches" id="import-saved-search-button">Import</button>
    </span>
    <button title="Save result ids as search" id="save-results-button">Save Results</button>
  </div>
  <div id="saved-searches-container">
    <div id="saved-searches-input-container">
      <textarea id="saved-searches-input" spellcheck="false" style="width: 97%;"
        placeholder="Save Custom Search"></textarea>
    </div>
    <div id="saved-search-list-container">
      <ul id="saved-search-list"></ul>
    </div>
  </div>
</div>
<script>
</script>
`;
export const SETTINGS_HTML = `
<!-- <div id="favorite-options"></div>
<div id="dynamic-favorite-options"></div>
<div id="layout-sort-container" class="inline-option-container">
  <div id="layout-container">
    <label>Layout</label>
    <br>
  </div>
  <div id="sort-container" title="Change sorting order of search results">
    <span id="sort-labels">
      <label style="margin-right: 22px;" for="sorting-method">Sort By</label>
      <label style="margin-left:  22px;" for="sort-ascending">Ascending</label>
    </span>
    <div id="sort-inputs">
    </div>
  </div>
</div>

<div id="results-columns-container" class="inline-option-container">
  <div id="results-per-page-container"
    title="Set the maximum number of search results to display on each page\nLower numbers improve responsiveness">
    <span class="number-label-container">
      <label id="results-per-page-label" for="results-per-page-input">Results per Page</label>
    </span>
    <br>
  </div>
  <div id="column-count-container" title="Set the number of favorites per row">
    <div>
      <span class="number-label-container">
        <label id="column-count-label">Columns</label>
      </span>
      <br>
    </div>
  </div>
  <div id="row-size-container" title="Set the height of each row">
    <div>
      <span class="number-label-container">
        <label id="row-size-label">Row height</label>
      </span>
      <br>
    </div>
  </div>
</div>

<div id="rating-container" title="Filter search results by rating">
</div>

<div id="performance-profile-container" title="Improve performance by disabling features">
  <label for="performance-profile">Performance Profile</label>
  <br>
</div> -->
<div id="favorite-options"></div>
<div id="dynamic-favorite-options"></div>
<div id="layout-container"><label>Layout</label><br></div>
<div id="sort-container" title="Change sorting order of search results">
  <span id="sort-labels">
    <label style="margin-right: 22px;" for="sorting-method">Sort By</label>
    <label style="margin-left:  22px;" for="sort-ascending">Ascending</label>
  </span>
  <div id="sort-inputs"></div>
</div>
<div id="results-per-page-container"
  title="Set the maximum number of search results to display on each page\nLower numbers improve responsiveness">
  <span class="number-label-container">
    <label id="results-per-page-label" for="results-per-page-input">Results per Page</label>
  </span>
  <br>
</div>
<div id="column-count-container" title="Set the number of favorites per row">
  <div>
    <span class="number-label-container">
      <label id="column-count-label">Columns</label>
    </span>
    <br>
  </div>
</div>
<div id="row-size-container" title="Set the height of each row">
  <div>
    <span class="number-label-container">
      <label id="row-size-label">Row height</label>
    </span>
    <br>
  </div>
</div>
<div id="rating-container" title="Filter search results by rating">
</div>

<div id="performance-profile-container" title="Improve performance by disabling features">
  <label for="performance-profile">Performance Profile</label>
  <br>
</div>
`;
export const SIDEBAR_HTML = `
<style>
  :root {
    --sidebar-width: 50px;
    --sidebar-drawer-width: 200px;
    --sidebar-full-width: calc(var(--sidebar-width) + var(--sidebar-drawer-width));
    --sidebar-drawer-transition: 0.15s ease;
  }

  .sidebar-container {
    position: relative;
    display: flex;
    flex-direction: row;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  #sidebar-content-container {
    flex: 1;
    margin-left: var(--sidebar-width);
    transition: margin-left var(--sidebar-drawer-transition);
  }

  #sidebar-content-container.shifted {
    margin-left: var(--sidebar-full-width);
  }

  .sidebar {
    position: fixed;
    background-color: #2e2e2e;
    list-style-type: none;
    height: 100%;
    padding: 0;
    margin: 0;
    width: var(--sidebar-width);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
  }


  .sidebar li {
    margin: 5px 0px;
  }

  .sidebar li a {
    color: white;
    text-decoration: none;
    width: 40px;
    aspect-ratio: 1/1;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.3s, border-radius 0.3s;
  }

  .sidebar li a:hover {
    background-color: #444444;
    border-radius: 8px;
  }

  .sidebar li.active {
    position: relative;
  }

  .sidebar li.active::before {
    content: '';
    position: absolute;
    left: -5px;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: #0075FF;
  }

  .sidebar li svg {
    height: 90%;
  }

  .horizontal-drawer {
    position: fixed;
    white-space: nowrap;
    overflow: hidden;
    width: 0px;
    height: 100%;
    background-color: #2e2e2e;
    color: white;
    box-sizing: border-box;
    left: var(--sidebar-width);
    top: 0;
    transition: width var(--sidebar-drawer-transition);
    z-index: 200000;
  }

  .horizontal-drawer>div {
    padding: 5px 10px;
  }

  .horizontal-drawer.open {
    width: var(--sidebar-drawer-width);
  }

  .horizontal-drawer h2 {
    margin-top: 0;
  }

  .drawer-title {
    margin-top: 10px;
    margin-left: 10px;
  }


  .sidebar-separator {
    position: relative;
  }

  .sidebar-separator::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    background: white;
  }
</style>
`;
export const SKELETON_HTML = `
<style>
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
    /* width: 100%; */
    /* aspect-ratio: 1/3; */
    background: #555;
    overflow: hidden;
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
</style>
`;
export const TAG_MODIFIER_HTML = `
<div id="tag-modifier-container">
  <style>
    #tag-modifier-ui-container {
      display: none;

      >* {
        margin-top: 10px;
      }
    }

    #tag-modifier-ui-textarea {
      width: 80%;
    }

    .favorite.tag-modifier-selected {
      outline: 2px dashed white !important;

      >div, >a {
        opacity: 1;
        filter: grayscale(0%);
      }
    }

    #tag-modifier-ui-status-label {
      visibility: hidden;
    }

    .tag-type-custom>a,
    .tag-type-custom {
      color: hotpink;
    }
  </style>
  <div id="tag-modifier-option-container">
    <label class="checkbox" title="Add or remove custom or official tags to favorites">
      <input type="checkbox" id="tag-modifier-option-checkbox"> Modify Tags<span class="option-hint"></span>
    </label>
  </div>
  <div id="tag-modifier-ui-container">
    <label id="tag-modifier-ui-status-label">No Status</label>
    <textarea id="tag-modifier-ui-textarea" placeholder="tags" spellcheck="false"></textarea>
    <div id="tag-modifier-buttons">
      <span id="tag-modifier-ui-modification-buttons">
        <button id="tag-modifier-ui-add" title="Add tags to selected favorites">Add</button>
        <button id="tag-modifier-remove" title="Remove tags from selected favorites">Remove</button>
      </span>
      <span id="tag-modifier-ui-selection-buttons">
        <button id="tag-modifier-ui-select-all" title="Select all favorites for tag modification">Select all</button>
        <button id="tag-modifier-ui-un-select-all" title="Unselect all favorites for tag modification">Unselect
          all</button>
      </span>
    </div>
    <div id="tag-modifier-ui-reset-button-container">
      <button id="tag-modifier-reset" title="Reset tag modifications">Reset</button>
    </div>
    <div id="tag-modifier-ui-configuration" style="display: none;">
      <button id="tag-modifier-import" title="Import modified tags">Import</button>
      <button id="tag-modifier-export" title="Export modified tags">Export</button>
    </div>
  </div>
</div>
`;
export const TOOLTIP_HTML = `
<div id="tooltip-container">
  <style>
    #tooltip {
      max-width: 750px;
      border: 1px solid black;
      padding: 0.25em;
      position: absolute;
      box-sizing: border-box;
      z-index: 25;
      pointer-events: none;
      visibility: hidden;
      opacity: 0;
      /* transition: visibility 0s, opacity 0.25s linear; */
      font-size: 1.05em;
    }

    #tooltip.visible {
      visibility: visible;
      opacity: 1;
    }
  </style>
</div>
`;
export const UTILITIES_HTML = `
<style>
  body {
    overflow-x: hidden;
    &:fullscreen,
    &::backdrop {
      background-color: var(--c-bg);
    }
  }

  .light-green-gradient {
    background: linear-gradient(to bottom, #aae5a4, #89e180);
    color: black;
  }

  .dark-green-gradient {
    background: linear-gradient(to bottom, #5e715e, #293129);
    color: white;
  }

  img {
    border: none !important;
  }

  .not-highlightable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  input[type=number] {
    border: 1px solid #767676;
    border-radius: 2px;
  }

  .size-calculation-div {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    visibility: hidden;
    transition: none !important;
    transform: scale(1.05, 1.05);
  }

  .number {
    white-space: nowrap;
    position: relative;
    margin-top: 5px;
    border: 1px solid;
    padding: 0;
    border-radius: 20px;
    background-color: white;

    >hold-button,
    button {
      position: relative;
      top: 0;
      left: 0;
      font-size: inherit;
      outline: none;
      background: none;
      cursor: pointer;
      border: none;
      margin: 0px 8px;
      padding: 0;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200%;
        height: 100%;
        /* outline: 1px solid greenyellow; */
        /* background-color: hotpink; */
      }

      &:hover {
        >span {
          color: #0075FF;
        }
      }

      >span {
        font-weight: bold;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
        position: relative;
        pointer-events: none;
        border: none;
        outline: none;
        top: 0;
        z-index: 5;
        font-size: 1.2em !important;
      }

      &.number-arrow-up {
        >span {
          transition: left .1s ease;
          left: 0;
        }

        &:hover>span {
          left: 3px;
        }
      }

      &.number-arrow-down {
        >span {
          transition: right .1s ease;
          right: 0;
        }

        &:hover>span {
          right: 3px;
        }
      }
    }

    >input[type="number"] {
      font-size: inherit;
      text-align: center;
      width: 2ch;
      padding: 0;
      margin: 0;
      font-weight: bold;
      padding: 3px;
      background: none;
      border: none;

      &:focus {
        outline: none;
      }
    }

    >input[type="number"]::-webkit-outer-spin-button,
    >input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      appearance: none;
      margin: 0;
    }

    input[type=number] {
      appearance: textfield;
      -moz-appearance: textfield;
    }
  }

  .fullscreen-icon {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10010;
    pointer-events: none;
    width: 30vw;
  }

  input[type="checkbox"] {
    accent-color: #0075FF;
  }

  .thumb {
    >a {
      pointer-events: none;

      >img {
        pointer-events: all;
      }
    }
  }

  .blink {
    animation: blink 0.35s step-start infinite;
  }

  @keyframes blink {
    0% {
      opacity: 1;
    }

    50% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  /* html::before {
    content: "";
    position: fixed;
    z-index: 10000;
    opacity: 0;
    background: black;
    transition: opacity 0.2s linear;
    pointer-events: none;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  } */

  html.fullscreen-effect::before {
    opacity: 1;
  }

  html.transition-disabled::before {
    transition: none;
}
</style>
`;
