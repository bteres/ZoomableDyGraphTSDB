# ZoomableDyGraphTSDB
#### Copyright (c) 2014-, Brett R. Terespolsky

The ZoomableDyGraphTSDB library produces graphs from an OpenTSDB database and plots it using Dygraphs. The interactive chart loads only the required data upon zoom/pan.

### Features
* Plots timeseries data from OpenTSDB.
* Only loads a limited amount of data points regardless of range of data.
* Refines data on zoom.

### Demo
Go to [http://witsmeter.tk](http://witsmeter.tk) for a basic demo.

### TODO
* ~~Create dropdown list from OpenTSDB metrics and plot on selection.~~
* Fix range selector on change of metric.
* Support multiple series on one plot.
* Allow for error bars on graph.
* Allow for further options from html such as setting start date, metric name, etc.

### Acknowledgement
1. [kaliatech on Github](https://github.com/kaliatech). A lot of the code used in this library is taken from his work done on creating [dygraphs with dynamic zooming](https://github.com/kaliatech/dygraphs-dynamiczooming-example/blob/master/README.md).
2. Josh Sanderson (who I believe is kaliatech) for his his posts in google groups which have lead to algorithms developed here.

### External Packages
* jQuery - [http://jquery.com/](http://jquery.com/)
* Bootstrap - [http://getbootstrap.com/](http://getbootstrap.com/)
* Dygraphs - [http://dygraphs.com/](http://dygraphs.com/)
* Spin.js - [http://fgnass.github.io/spin.js/](http://fgnass.github.io/spin.js/)
* Moment.js - [http://momentjs.com/](http://momentjs.com/)

### License
MIT License included in `LICENSE`

### Contact
Contact me on [bteres@ieee.org](mailto:bteres@ieee.org) for suggestions, feature requests or to participate in the development.
