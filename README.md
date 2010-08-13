YouTube Player
==============

This library provides accessible HTML controls and easy embedding for YouTube
videos. It's keyboard-navigable and easy to style and modify.

The accessibility aspects of this project are discussed in more detail on
[the OTHERTech blog][othertech].


Usage
-----

Using the `YoutubePlayer` class is very straightforward. First, create a
container to insert the video into; normally this is just an empty `div`
element. Then set the `YoutubePlayer.API_KEY` to your YouTube API key. Finally,
create a new instance of the `YoutubePlayer` class, passing in the ID of the
YouTube video you want to embed, the `id` attribute of your container, and (if
you want to configure the player further) an `options` object.

    <div id="videocontainer"></div>
    
    <script type="text/javascript">
        (function() {
            YoutubePlayer.API_KEY = '_your_youtube_api_key_';
            
            var player = new YoutubePlayer('_video_id_', 'videocontainer', {
                height:      400,
                skipTime:    30,
                volumeSteps: 4
            });
        })();
    </script>

One caveat to all this: the `id` of your container shouldn't include dashes, as
Flash chokes on them. Use underscores instead.

### Options

The `options` object can have three numeric properties:

* `height`: the height of the video in pixels (this defaults to the width
  divided by the default aspect ratio, which is 4:3);
* `skipTime`: the number of seconds to seek backwards or forwards when the skip
  controls are used (the default is 15);
* `volumeSteps`: the number of steps in the stepped volume controls (the
  default is 4).

### Dependencies

The `YoutubePlayer` class depends on [JS.Class][jsclass], [Ojay][ojay],
[SWFObject][swfobject] and [`YAHOO.widget.Slider`][slider]. A full list of the
objects the class depends on is given in the `jake.yml` file.

### Helium

If you use [Helium][helium], it's just a matter of adding this repository to
your Helium system, setting the requisite version numbers for the libraries it
depends on, and using the `require` function as usual:

    Helium.use('yui', '2.8.0r4');
    Helium.use('ojay', '0.4.2');
    Helium.use('swfobject', 'master');
    
    require('YoutubePlayer', function() {
          YoutubePlayer.API_KEY = '_api_key_';
          
          var player = new YoutubePlayer('_video_id_', '_container_');
    });

### Using the default style

Since the controls are just simple semantic HTML, they are easy to style
however your project requires. However, we also include a default control
style, which is minimal and unbranded, in clear neutral tones, making it ideal
for using out-of-the-box without the need for customisation.

To use it, just copy the `controls.css` file out of the `test` directory, along
with the `video-controls.png` graphics file. If you don't keep them in the same
directory, you may have to change the path to the graphic in the CSS.


License
-------

This library is open source code, released under the BSD license. Please see
the `LICENSE` file for details. It was developed by **Benedict Eastaugh**,
**James Coglan**, **Gareth Rake** and **Hollie Lubbock** at
[the OTHER media][othermedia].

  [othertech]:  http://tech.othermedia.org
  [jsclass]:    http://jsclass.jcoglan.com
  [ojay]:       http://ojay.othermedia.com
  [swfobject]:  http://code.google.com/p/swfobject/
  [slider]:     http://developer.yahoo.com/yui/slider/
  [helium]:     http://github.com/othermedia/helium
  [othermedia]: http://www.othermedia.com
