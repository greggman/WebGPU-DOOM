* handle 256 texture array layer limit - needs to work on lower end devices.
  * reduce wasted atlas space (pack them and upload offsets in storage buf?)
 
  It seems like we could choose a size like (1024x1024)
  and then load textures into those. We'd have a storage buffer
  `struct TexInfo { layer: u32, xOffset: u32, yOffset: u32, width: u32, height: u32, }; var<storage, read> texInfo: array<TexInfo>;`
  and then we can load textures of a wad into any free area in those
  layers. Maybe there is a simple algo like a 64x64 sprite going in
  one layer makes that entire layer 64x64, or maybe there is some
  other simple packing algorithm.

  The point of this is to make it run with max 256 layers.

* On Geometry - increasing the buffer size seems questionable. Is it possible to just allocate the correct size from the beginning?
* make it function on mobile some how - take inspiration from PUBG?
* make sure it handles all window sizes
* you mentioned 3 calls to draw hud? Can it be one?
* death state is wrong - it prints "press button to restart" but the real app
  prints nothing and I think you have to press space. Fire (mouse click) does not
  restart.
* In another folder, port this implementation to WebGL2
  WebGPU has not reached ubiquity yet so people will whine.
* Consider an optional post processing step
  * provide the rendered image, depth buffer, normal for walls if they exist - then
    have 6 or 10 non-photorealistic. 

    Note: Either an option or a search param would enable this.
    We'd use an HTML toolbar with dropdown to choose a post process.
    Maybe a live editor can popup in the side with an toggle in the toolbar
    so you can edit post processing shaders. Can save the shader deflated
    and base64ed in the URL so that you can share.
    
    Ideas:
    * show normals
    * show depth
    * screen space ambient occlusion?
    * wireframe
    * blueprint
    * halftone
    * C.R.T (scanlines/bend/static/warp)
    * VHS (similar to CRT but common VHS artifacts)
    * 60s black and white video camera mode? Whites wash out
    * HQX
    * xBR, xBRz, SuperXBR
    * Text
    * LED display
    * Flip display
    * B/W Mac style 
    * JSON (let use provide shader)
    * URL (let use provide URL to fetch JSON)
