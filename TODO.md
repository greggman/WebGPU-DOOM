* Put back "Old TV Effect" now that we have random and/or URL textures
* Add Macintosh / Return of Obra Dinn
* UVs (iUVs)
  * sprite uvs - lets us make curved normals across surface. Might help crosshatch
    or do other interesting effects. uvs should be normalized across sprite.
  * triangle uvs - if this is possible, post process can distinguish between
    wall UVs and sprite UVs is iSprite
* Sprite ID? (iSpriteId)
  This would be info about the sprite:
    * what "thing" is the sprite
      * shotgun
      * big health
      * small health
      * potion
      * bullets
      * shotgun shells
      * zombieman
      * imp
      * explosion
      * play's gun
    * what frame it's showing
    * which way it was facing
  This would allow effects to color weapons different than
  monsters, different than collectables, different than
  explosions, etc...
