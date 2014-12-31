hangouts-analzyer
=====

*hangouts-analzyer* is a tool for analyzing and visualizing the wealth of information available in your [Google Hangouts](http://www.google.com/hangouts/) history. Current visualizations and data include:

* Messages sent by participant
* Characters sent by participant
* Message send time by participant
* Who starts the conversation...
* ...and who gets the last word?
* Messages per day by participant
* Relative sentiment by participant (AFINN-111)
* Emoji usage through time by participant
* Most frequently used emoji by participant
* Most frequently used words (word cloud)
* Most frequently used words by participant (word cloud)
* CSV conversation export functionality
* ...and more...

*hangouts-analyzer* processes Google Takeout data and runs 100% in the browser &ndash; all processing happens on the user's computer, and no data is uploaded to any external servers.

## Building

*hangouts-analyzer* uses [grunt](http://gruntjs.com/) to build and minify source files. All development goes on in `src`, and `grunt build` is run to create the `index.html` and associated minified js & css files found in the root directory, which are served using GitHub Pages.

```
# To set up...
$ cd hangouts-analyzer && npm install
# When you're ready to build
$ grunt build
```

## License

Copyright (C) 2014 Theopolisme <theo@theopatt.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
