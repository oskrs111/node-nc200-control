# node-nc200-control
[Electron](https://electron.atom.io/) and [Polymer](https://www.polymer-project.org) based 
NC200 tp-Link wifi camera setup tool.

The main reason to this development is to provide a simplified way to setup some features on the NC200 tp-Link WiFi Camera, that currently is not possible to perform throug it's embedded web interface beause it uses some kind of plugin that is not supported by the modern web browsers (!).

This lack of plugin support on modern web browsers prevents to configure the main NC200 feature that is the **motion sensor capability**. Also there are some other interesting adjustments like **'flip'** or **'mirror'** on the video stream that are not posible to perform with provided tp-Link tools or NC200 web interface.

This tool is inspired on a similar application from [reald/nc220](https://github.com/reald/nc220) implemented on
a pearl script, and the study of javascript code from NC200 web interface.

## Main features
> Beta 0.0.2
This release provides support for:
- Login into NC200 Camera.
- Retrieve most parameters from NC200 Camera.
- View and configure Motion Detection parameters.
- View and configure Video Control paramters.

## Support
> Beta 0.0.2
This release only has been tested witn NC200 Camera, firmware NC200_v2.1.7_160315_a, hardware V1.

## Releases
> Beta 0.0.2
This release is provided also as binary distribution for:
- Win32
- MacOs (Not Tested)
- Linux (Not Tested)

## Building
> Beta 0.0.2
As this application is Electron/Polymer based, use the standard steps to get code and install dependencies. Be sure to have [Node-LTS](https://nodejs.org/en/download/) runtime and [Bower](https://bower.io/) modulue installed before.

**NOTICE:
There is a module dependence with "ajax-request". This module has a pending pull request for version 1.2.3 that adds format support on POST requests, needed by the main application. So in case you want to get all the source 
code i suggest to get from my branch [oskrs111/ajax-request](https://github.com/oskrs111/ajax-request) and replace in /node_modules path**

```Batchfile
> git clone https://github.com/oskrs111/node-nc200-control.git
```

```Batchfile
> cd node-nc200-control
```

```Batchfile
> node-nc200-control/npm install
```

```Batchfile
> node-nc200-control/cd www
```

```Batchfile
> node-nc200-control/www/bower install
```

## Running
Run the normal npm start command

```Batchfile
> node-nc200-control/npm start
```


