# Visual and audio assets

All stickers in `src/assets.js` are original SVG artwork created for this project: cat, cat ears, paw, bow/ribbon, heart, star, flower, cloud, and strawberry. The video compositor adds an original scalloped lace border and stationery grid. No protected characters, emoji decoration, or third-party music are used. The demo subject is an original canvas illustration.

Reference research: [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) (CC0) was reviewed for reusable particle motifs. A unified original set was chosen instead of mixing clip art. Lucide supplies interface icons under its ISC license. Google Fonts supplies DM Sans, Space Grotesk, and IBM Plex Mono under their respective open font licenses.

Detection uses MediaPipe Tasks Vision and official Google-hosted pose and gesture-recognition models. Models and WASM download on camera startup; no photos are uploaded. Pose segmentation supplies the subject alpha mask. Face framing uses the pose model's facial keypoints; this is entertainment, not identity recognition. The anatomical hand and face guides in `src/pose-guide.js` are original SVG artwork.

The soundtrack is the user-supplied `assets/Nyae inchi.mp3`. Its ownership and license were not supplied; it is not part of the original illustration license. The edit uses seconds 9 through 21 by default. The exported video is a 12-second animated photo collage, not generative human motion.
