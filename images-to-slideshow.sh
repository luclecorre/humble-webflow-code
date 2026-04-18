#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"

if ! command -v img2webp &>/dev/null; then
    osascript -e 'display alert "img2webp not found" message "Run: brew install webp"'
    exit 1
fi

TMPDIR_SLIDES=$(mktemp -d)

RATIO=$(osascript -e 'choose from list {"16:9", "3:2", "Keep original ratio"} with title "Images to Slideshow" with prompt "Step 1 — Choose image ratio:" default items {"16:9"}')
[ "$RATIO" = "false" ] && rm -rf "$TMPDIR_SLIDES" && exit 0

WIDTH_RAW=$(osascript -e 'text returned of (display dialog "Step 2 — Output width (px):" with title "Images to Slideshow" default answer "1920")')
[ $? -ne 0 ] && rm -rf "$TMPDIR_SLIDES" && exit 0

if ! echo "$WIDTH_RAW" | grep -qE '^[0-9]+$' || [ "$WIDTH_RAW" -lt 100 ]; then
    osascript -e 'display alert "Invalid width" message "Please enter a whole number, e.g. 1920"'
    rm -rf "$TMPDIR_SLIDES" && exit 1
fi

WIDTH="$WIDTH_RAW"

FILENAME_RAW=$(osascript -e 'text returned of (display dialog "Step 3 — File name:" with title "Images to Slideshow" default answer "")')
[ $? -ne 0 ] && rm -rf "$TMPDIR_SLIDES" && exit 0
FILENAME=$(echo "$FILENAME_RAW" | sed 's/\.[^.]*$//' | tr -s ' ' '-')
[ -z "$FILENAME" ] && FILENAME="slideshow"

DURATION=$(osascript -e 'text returned of (display dialog "Step 4 — Duration per image (seconds):" with title "Images to Slideshow" default answer "2")')
[ $? -ne 0 ] && rm -rf "$TMPDIR_SLIDES" && exit 0

if ! echo "$DURATION" | grep -qE '^[0-9]+(\.[0-9]+)?$' || [ "$(echo "$DURATION <= 0" | bc)" = "1" ]; then
    osascript -e 'display alert "Invalid duration" message "Please enter a positive number, e.g. 1.5"'
    rm -rf "$TMPDIR_SLIDES" && exit 1
fi

QUALITY=$(osascript -e 'choose from list {"web", "good"} with title "Images to Slideshow" with prompt "Step 5 — Choose quality:" default items {"web"}')
[ "$QUALITY" = "false" ] && rm -rf "$TMPDIR_SLIDES" && exit 0

case "$QUALITY" in
    web)  Q=60 ;;
    good) Q=70 ;;
esac

FRAME_DURATION_MS=$(echo "$DURATION * 1000 / 1" | bc)

if [ "$RATIO" = "Keep original ratio" ]; then
    VF="scale=${WIDTH}:-2:flags=lanczos,unsharp=3:3:0.5"
else
    NUM="${RATIO%%:*}"
    DEN="${RATIO##*:}"
    VF="scale='if(gt(a,${NUM}/${DEN}),trunc(oh*a/2)*2,${WIDTH})':'if(gt(a,${NUM}/${DEN}),${WIDTH}*${DEN}/${NUM},trunc(ow/a/2)*2)':flags=lanczos,crop=${WIDTH}:${WIDTH}*${DEN}/${NUM}:'(in_w-${WIDTH})/2':'(in_h-${WIDTH}*${DEN}/${NUM})/2',unsharp=3:3:0.5"
fi

INDEX=0
FRAME_ARGS=()
for INPUT in "$@"; do
    FRAME_PATH="$TMPDIR_SLIDES/frame_$(printf '%05d' $INDEX).png"

    ffmpeg -i "$INPUT" -vf "$VF" -frames:v 1 \
        "$FRAME_PATH" -y -loglevel error

    if [ ! -f "$FRAME_PATH" ]; then
        osascript -e "display alert \"Failed on frame $INDEX\" message \"ffmpeg could not process: $INPUT\""
        rm -rf "$TMPDIR_SLIDES" && exit 1
    fi

    FRAME_ARGS+=(-d "$FRAME_DURATION_MS" "$FRAME_PATH")
    INDEX=$((INDEX + 1))
done

OUTPUT_DIR=$(dirname "$1")
OUTPUT_BASE="$OUTPUT_DIR/$FILENAME"
OUTPUT="${OUTPUT_BASE}.webp"
COUNTER=2
while [ -e "$OUTPUT" ]; do
    OUTPUT="${OUTPUT_BASE}_${COUNTER}.webp"
    COUNTER=$((COUNTER + 1))
done

# -m 4 (not 6): Safari iOS fails to animate WebPs encoded with -m 5/6 when
# frames are complex or the file is large. Method 4 is the highest level with
# reliable cross-browser animated WebP support.
# Keep output under ~5 MB for iOS Safari: use a narrower width if needed.
img2webp -loop 0 -lossy -q $Q -m 4 "${FRAME_ARGS[@]}" -o "$OUTPUT"

if [ ! -f "$OUTPUT" ]; then
    osascript -e 'display alert "img2webp failed" message "No output file was created."'
    rm -rf "$TMPDIR_SLIDES" && exit 1
fi

rm -rf "$TMPDIR_SLIDES"

osascript -e 'display notification "Slideshow created!" with title "Images to Slideshow"'