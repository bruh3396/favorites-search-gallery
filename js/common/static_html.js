class HTMLStrings {
  static utilities = `
<style>
  body {

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

  html::before {
    content: "";
    position: fixed;
    z-index: 10000;
    opacity: 0.1;
    background: black;
    transition: opacity 0.2s linear;
    pointer-events: none;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  html.fullscreen-effect::before {
    opacity: 1;
  }

  html.transition-disabled::before {
    transition: none;
}
</style>
`;

  static favorites = `
<div id="favorites-search-gallery-menu" class="light-green-gradient not-highlightable">
  <style>
    #favorites-search-gallery-menu {
      position: sticky;
      top: 0;
      padding: 10px 20px;
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

    .add-or-remove-button {
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

    .remove-favorite-button {
      color: red;
    }

    .add-favorite-button {
      >svg {
        fill: hotpink;
      }
    }

    .statistic-hint {
      position: absolute;
      z-index: 3;
      text-align: center;
      right: 0;
      top: 0;
      background: white;
      color: #0075FF;
      font-weight: bold;
      /* font-size: 18px; */
      pointer-events: none;
      font-size: calc(8px + (20 - 8) * ((100vw - 300px) / (3840 - 300)));
      width: 55%;
      padding: 2px 0px;
      border-bottom-left-radius: 4px;
      text-shadow: none;
    }

    img {
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
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

    #column-count-container {
      >div {
        align-content: center;
      }
    }

    #find-favorite {
      display: none;
      margin-top: 7px;

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

    #favorites-search-gallery-content {
      padding: 0px 20px 30px 20px;
      --gutter: 8px;

      &.grid,
      &.square {
        display: grid !important;
        grid-template-columns: repeat(10, 1fr);
        grid-gap: var(--gutter);

        .add-or-remove-button {
          width: 40%;
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
        gap: var(--gutter);

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

        .add-or-remove-button {
          height: 40%;
        }
      }

      &.column {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: var(--gutter);
        margin-right: 15px;

        .favorites-column {
          display: flex;
          flex-direction: column;
          flex: 0 0 25%;
          gap: var(--gutter);

          .favorite {
            border-radius: 10px;
            overflow: hidden;
          }
        }

        .add-or-remove-button {
          width: 40%;
        }
      }
    }

    #help-links-container {
      >a:not(:last-child)::after {
        content: " |";
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
      }

      >label[for="questionable-rating"] {
        margin-left: -3px;
      }

      >label[for="safe-rating"] {
        margin-left: -3px;
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

    .add-or-remove-button {
      visibility: hidden;
      cursor: pointer;
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

    #find-favorite-input {
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

    #left-favorites-panel-top-row>button:not(:last-of-type) {
      margin-right: 5px;
    }

    #sort-container {
      position: relative;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
      transform: scale(.70);
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

    /* #sort-ascending-checkbox {
            width: 0 !important;
            height: 0 !important;
            position: static !important;
        } */

    .inline-option-container {
      >div {
        display: inline-block;
      }
    }
  </style>
  <div id="favorites-search-gallery-menu-panels" style="display: flex;">
    <div id="left-favorites-panel">
      <h2 style="display: inline;" id="search-header">Search Favorites</h2>
      <span id="favorites-load-status" style="margin-left: 5px;">
        <label id="match-count-label"></label>
        <label id="favorites-load-status-label"></label>
      </span>
      <div id="left-favorites-panel-top-row">
        <span id="favorites-pagination-placeholder"></span>
        <span id="help-links-container">
          <a href="https://github.com/bruh3396/favorites-search-gallery/#controls" target="_blank">Help</a>
          <a href="https://sleazyfork.org/en/scripts/504184-rule34-favorites-search-gallery/feedback"
            target="_blank">Feedback</a>
          <a href="https://github.com/bruh3396/favorites-search-gallery/issues" target="_blank">Report
            Issue</a>
          <a id="whats-new-link" href="" class="hidden light-green-gradient">What's new?

            <div id="whats-new-container" class="light-green-gradient">
              <h4>1.18:</h4>
              <h5>Features:</h5>
              <ul>
                <li>Improved/fixed mobile UI</li>
                <li>Improved mobile controls</li>
                <li>Added gallery autoplay for mobile</li>
                <li>Added sort by random (auto shuffle)</li>
                <li>Added dark theme option</li>
                <li>Minor UI fixes</li>
                <li>Minor gallery fixes</li>
              </ul>
            </div>
          </a>
        </span>
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
              <div id="layout-sort--container" class="inline-option-container">
                <div id="layout-container">
                  <label>Layout</label>
                  <br>
                </div>
                <div id="sort-container" title="Change sorting order of search results">
                  <label style="margin-right: 22px;" for="sorting-method">Sort By</label>
                  <label style="margin-left:  22px;" for="sort-ascending">Ascending</label>
                  <br>
                </div>
              </div>
              <div id="results-columns-container" class="inline-option-container">
                <div id="results-per-page-container"
                  title="Set the maximum number of search results to display on each page
Lower numbers improve responsiveness">
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
                <label>Rating</label>
                <br>
                <div id="allowed-ratings" class="not-highlightable" data-action="changeAllowedRatings">
                  <input type="checkbox" id="explicit-rating" checked>
                  <label for="explicit-rating">Explicit</label>
                  <input type="checkbox" id="questionable-rating" checked>
                  <label for="questionable-rating">Questionable</label>
                  <input type="checkbox" id="safe-rating" checked>
                  <label for="safe-rating" style="margin: -3px;">Safe</label>
                </div>
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
            <span id="find-favorite">
              <button title="Find favorite favorite using its ID" id="find-favorite-button"
                style="white-space: nowrap;">Find</button>
              <input type="number" id="find-favorite-input" placeholder="ID">
            </span>
          </div>
        </div>

        <div id="bottom-panel-4">

        </div>
      </div>
    </div>
    <div id="right-favorites-panel"></div>
  </div>
  <div id="loading-wheel"></div>
</div>
`;

  static autoplay = `
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

  static gallery = `
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
    z-index: 9000;
    position: fixed;
    top: 0;
    left: 0;

    * {
      top: 0;
      left: 0;
      position: fixed;
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
    }

    canvas,
    img {
      overflow: hidden;
      pointer-events: none;
      height: 100vh;
      margin: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
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
    display: none;
    pointer-events: none;
    cursor: none;
    width: 100vw;
    height: 100vh;

    &.active {
      pointer-events: all;
    }

    &.visible {
      display: block;
    }
  }

  #gallery-original-content-link {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: red;
    z-index: 1;
    pointer-events: none;
    cursor: default;
    opacity: 0;


    &.active {
      /* opacity: 0.5; */
      pointer-events: all;
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
          fill: #0075FF;
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

  static galleryDebug = `
.thumb,
.favorite {
  &.debug-selected {
    outline: 3px solid #0075FF !important;
  }

  &.loaded {

    div, a {
      outline: 2px solid transparent;
      animation: outlineGlow 1s forwards;
    }

    .image {
      opacity: 1;
    }
  }

  >a
  >canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 1;
    visibility: hidden;
  }

  .image {
    opacity: 0.4;
    transition: transform 0.1s ease-in-out, opacity 0.5s ease;
  }

}

.image.loaded {
  animation: outlineGlow 1s forwards;
  opacity: 1;
}

@keyframes outlineGlow {
  0% {
    outline-color: transparent;
  }

  100% {
    outline-color: turquoise;
  }
}

#original-video-container {
  video {
    opacity: 0.15;
  }
}

`;

  static tooltip = `
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
      transition: visibility 0s, opacity 0.25s linear;
      font-size: 1.05em;
    }

    #tooltip.visible {
      visibility: visible;
      opacity: 1;
    }
  </style>
</div>
`;

  static caption = `
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

  static savedSearches = `
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

  static tagModifier = `
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

  static desktop = `
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

  static mobile = `
<style>
  #performance-profile-container,
  #show-hints-container,
  #whats-new-link,
  #show-ui-div,
  #search-header,
  #row-size-container,
  #left-favorites-panel-top-row {
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

  .add-or-remove-button {
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
    background: white;

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
</style>
`;
}
