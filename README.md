# Tomodoro
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z6E84CZ)&nbsp;
<a href="https://www.producthunt.com/posts/tomodoro?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-tomodoro" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=355079&theme=light" alt="Tomodoro - Simple&#0032;Pomodoro&#0032;timer&#0032;for&#0032;the&#0032;web | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

A pomodoro web app with PIP mode, white noise generation, tasks and more!

![Screenshot](https://lazy-guy.github.io/tomodoro/screenshot.png)

## Features:

-   Clean UI
-   PIP Mode
-   Tasks and Statistics
-   White Noise
-   Themes
-   Works Offline

## Tasks and Statistics

![Statistics](https://lazy-guy.github.io/tomodoro/statistics.png)

Tomodoro allows the creation of "Tasks". Time spent in a focus session can be dedicated to a task in order to generate statistics.
All the data is saved in your browser. Taking frequent backups is recommended. Backup and restore options are available in Tomodoro's settings.

## About Always On Top/PIP Mode

![PIP Demo](https://lazy-guy.github.io/tomodoro/pip.png)

**Not tested on Safari but might work**

PIP mode works by drawing on a canvas, capturing its stream and using it as source of a video element. Then it requests Picture-In-Picture.

On desktop Firefox, PIP button will only make the video visible but will not activate PIP. To switch to PIP mode, right click on the video and select "Watch in Picture-In-Picture".

On Android browsers, like Chrome for Android which does not support the Picture-In-Picture API, in order to switch to PIP mode, make the video fullscreen and then go to your device's homescreen without exiting fullscreen. If your browser is supported then PIP mode will be activated.

## To-Do

-   Make code cleaner
-   Add custom theming


## Credits
Icons from [Material Icons](https://developers.google.com/fonts/docs/material_icons)


## License
[MIT](LICENSE.md)