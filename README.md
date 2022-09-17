# Areas Plugin of Logseq
This is a plugin that make us be able to describe parts of a picture.

This plugin will be useful when you note concepts that contain a lot of visual things.

Please see below for details.

# Demo

![demo](./images/demo.gif)

# How-tos
## (1) Install the Areas Plugin.
Through Market Place \[Not Available Yet\]

1. Click `⋯` in the upper right corner.
2. Go to `Settings` > `Advanced` > `Developer mode` and enable.
3. Exit settings.
4. Click `⋯` again.
5. Go to `Plugins` > `Marketplace` and install the areas plugin.

Through `Load unpacked plugin`

![load](./images/1.png)

## (2) Register an Area Block
1. Put a picture in a block.
2. Open block context menu.
3. Click `Picture to Areas`.

![register](./images/2.png)

## (3) Edit Areas as You Wish.
Refer to [About Editor](#about-editor)
## (4) Click a Visiblity Button. \[Optional\]
To see only the area you select, click this:

![visiblity](./images/3.png)

## (5) Set a [property](#properties).
## (6) Click the area you want.
## (7) Change the [settings](#settings) to your liking. \[Optional\]

# About Editor

![editor video](./videos/editor.mp4)

## Enter the Editor
Press the edit button as follows:

![editor](./images/4.png)

## Edit the data.

![factors of edtior](./images/5.png)

(1) Keyboard Shortcuts

+ 1, 2, 3 : change mode
+ Q, W, E, R : change tool
+ Ctrl + drag : copy area or shape \[select mode\]
+ Ctrl + S : save
+ Ctrl + Z : undo
+ Ctrl + Y : redo
+ Esc : cancel

(2) Mouse

+ left : drag or select a piece in canvas.
+ wheel : zoom in & zoom out

# Settings

![settings](./images/6.png)
> `⋯` > `Plugins` > `Areas` > `⚙️` > `Open settings`

+ strokesWidth : Width of strokes surrounding shapes.
+ strokesOutline : Degree to which strokes are emphasized.
+ controlPointRadius : Radius of control points used in the editor.
+ scrollDirection : Direction of enlargement along wheel direction.

# Properties
+ area-block : Conceptually connect a block and an area.
+ area-page : Conceptually connect a page and an area.

# Terms
+ piece : A word that combines area, shape, and point.
+ area : The largest unit that can be viewed as one.
+ shape : The lump that makes up an area.
+ point : The point that determines the form of shapes.
+ mode : An indicator of what to do.
+ hierarchy : A place for selecting changing name and color of areas

# Tips
1. if you want to resize image in the area block, try this in block:

> `{{renderer :areas-blabla, path}}` → `{{renderer :areas-blabla, path, <width>, <height>}}`

height is optional.

# Notes
1. When you want to add a piece.
+ To add a shape, select an area.
+ To add a point, select an shape.
2. Don't cancel it carelessly. No additional warnings are issued when attempting to cancel.

# Examples
1. exercise according to body parts

![exercise](./images/exercise.gif)

2. solving a geometry problem

![geometry](./images/geometry.gif)

3. logical elements

![logic](./images/logic.gif)

# Sources
<a href="https://www.flaticon.com/free-icons/edit" title="edit icons">Edit icons created by Pixel perfect - Flaticon</a>

<a href="https://www.flaticon.com/free-icons/view" title="view icons">View icons created by Andrean Prabowo - Flaticon</a>

<a href="https://www.flaticon.com/free-icons/visible" title="visible icons">Visible icons created by uicon - Flaticon</a>

<a href="https://www.flaticon.com/free-icons/save" title="save icons">Save icons created by Freepik - Flaticon</a>

<a href="https://www.flaticon.com/free-icons/trash" title="trash icons">Trash icons created by Freepik - Flaticon</a>
