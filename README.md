# GOKZ Replay Viewer
Prototype of a WebGL GOKZ recording player.

![](https://files.facepunch.com/ziks/2017/October/29/chrome_2017-10-29_22-27-47.png)

## Try it out!
https://metapyziks.github.io/GOKZReplayViewer/

## Usage
### Export Maps
First you'll need to use [SourceUtils](https://github.com/Metapyziks/SourceUtils) to export a bunch of maps, and
host them on a web server.

### Copy Resources
Your web page will need the `images`, `js` and `styles` folders from this repo.

### Setup Web Page

Make sure you include these references in your web page:

```html
<!-->Needed for decompressing map content</-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/base64-string.min.js"></script>

<!-->Map / replay viewer scripts</-->
<script src="js/facepunch.webgame.js"></script>
<script src="js/sourceutils.js"></script>
<script src="js/replayviewer.js"></script>

<!-->Map / replay viewer styles</-->
<link type="text/css" rel="stylesheet" href="styles/mapviewer.css" />
<link type="text/css" rel="stylesheet" href="styles/replayviewer.css" />
```

Then in the body of your page add a div that will host the canvas:

```html
<div id="example-viewer" style="width: 1024px;height: 768px;"></div>
```

Finally, use this JavaScript to create the viewer when the page loads:

```javascript
var viewer;
window.onload = function() {
    // Create a replay viewer canvas inside the #example-viewer div
    viewer = new Gokz.ReplayViewer(document.getElementById("example-viewer"));

    // Show FPS and frame time
    viewer.showDebugPanel = true;

    // Start playing immediately when the replay is loaded
    viewer.isPlaying = true;

    // Set the URL to look for maps exported using https://github.com/Metapyziks/SourceUtils
    // The example below will make the app look for de_dust2 at http://www.example.com/maps/de_dust2/index.json
    viewer.mapBaseUrl = "http://www.example.com/maps";

    // Start downloading a replay
    viewer.loadReplay("http://www.example.com/replays/test-replay.replay");

    // Attach an event handler to when a replay file is loaded
    viewer.replayLoaded.addListener(function(replay) {
        console.log("Replay is on map: " + replay.mapName + ", ran by: " + replay.playerName);
    });

    // Attach an event handler to when the current tick changes
    viewer.tickChanged.addListener(function(tickData) {
        if ((tickData.buttons & Gokz.Button.Jump) !== 0) {
            console.log("Jump is pressed on tick: " + tickData.tick);
        }
    });

    // Start the main loop
    viewer.animate();
}
```
